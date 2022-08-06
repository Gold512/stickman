import {math} from './math.js';
import {Client} from './spacial_hash.js';

const diagonalScaling = Math.pow(Math.sqrt(2), -1);

export class PlayerClient extends Client {
    constructor(position, dimensions, bars) {
        super(position, dimensions);
        this.bars = bars;
        this._health = 20;
        this._maxHealth = 20;

        this._maxMana = 50;
        this._mana = this._maxMana;

        this.manaRegen = 5;
        this.healthRegen = 1;

        this._regen = {health: 0, mana: 0};
    }

    // Mana and health regen
    Step(t) { 
        if(this._health < this._maxHealth) this._regen.health += (t / 1000) * this.healthRegen;
        if(this._mana < this._maxMana) this._regen.mana += (t / 1000) * this.manaRegen;

        for(let i in this._regen) {
            if(this._regen[i] >= 1) {
                this[i]++;
                this._regen[i]--;
            }
        }

        if(this._health > this._maxHealth) {
            this.health = this._maxHealth
            this._regen.health = 0;
        }

        if(this._mana > this._maxMana) {
            this.mana = this._maxMana
            this._regen.mana = 0;
        }
    }

    Move(keys, distance) {
        if( (keys.up || keys.down) && (keys.left || keys.right) ) distance *= diagonalScaling;

        if( !(keys.up && keys.down) && (keys.up || keys.down) ) {
            if(keys.down) {
                this.position[1] += distance;
            } else  {
                this.position[1] -= distance;
            }
        }
        
        if( !(keys.left && keys.right) && (keys.left || keys.right) ) {
            if(keys.right) {
                this.position[0] += distance;
            } else  {
                this.position[0] -= distance;
            }
        }
    }

    Render(ctx, offset, scale) {
        const pos = offset;
        // Render player 
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';

        ctx.fillRect(this.position[0] * scale + pos[0], this.position[1] * scale + pos[1], this.dimensions[0] * scale, this.dimensions[0] * scale);
    }

    SetStats(stats) {
        if(!stats) {
            this.stats = {

            };

            return;
        }
        this.stats = stats;
    }

    /**
     * @param {Number} v
     */
    set health(v) {
        this._health = v;
        this.bars.health.style.setProperty('--current', v)
    }

    get health() { return this._health; }

    set mana(v) {
        this._mana = v;
        this.bars.mana.style.setProperty('--current', v)
    }

    get mana() { return this._mana; }
}

export class Enemy extends Client {
    constructor(position, dimensions) {
        super(position, dimensions);
        this.action = {};
        this.speed = .03;
        this.velocity = [0, 0];

        this.maxHealth = 10;
        this.health = this.maxHealth;
    }

    ShootAt(pos) {
        const [x, y] = pos;
        const [cx, cy] = this.position;
        let vector = [x - cx, y - cy];
        const scaler = 1/Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        vector[0] *= scaler;
        vector[1] *= scaler;
        this.grid.InsertClient(new MagicProjectile([cx + vector[0], cy + vector[1]], .5, vector, .3, 1, 'black'));

    }

    Step(t) {
        if(!this.action.time || this.action.time <= 0) {
            this.action.direction = math.rand_int(1, 8);
            this.action.time = math.rand_int(150, 500);
        }

        this.action.time -= t;
        const s = 1;
        switch(this.action.direction) {
            case 1: 
                this.velocity = [s, 0];
                break;

            case 2:
                this.velocity = [s * diagonalScaling, s * diagonalScaling];
                break;

            case 3:
                this.velocity = [0, s];
                break;

            case 4:
                this.velocity = [s * diagonalScaling, - s * diagonalScaling];
                break;

            case 5:
                this.velocity = [0, -s];
                break;

            case 6:
                this.velocity = [- s * diagonalScaling, - s * diagonalScaling];
                break;

            case 7:
                this.velocity = [-s, 0];
                break;

            case 8:
                this.velocity = [- s * diagonalScaling, s * diagonalScaling];
                break;
            
        }

        this.position[0] += this.velocity[0] * this.speed;
        this.position[1] += this.velocity[1] * this.speed;

        if(math.rand_int(0, 500 / t) == 0) {
            let objects = this.grid.FindNear(this.position, [20, 20]);
            for(let i = 0; i < objects.length; i++) {
                if(objects[i] instanceof PlayerClient) {
                    this.ShootAt(objects[i].position)
                }
            }
            
        }
    }

    Render(ctx, offset, scale) {
        const pos = offset;
        // Render player 
        ctx.fillStyle = 'rgba(200, 0, 0, 1)';

        ctx.fillRect(this.position[0] * scale + pos[0], this.position[1] * scale + pos[1], this.dimensions[0] * scale, this.dimensions[1] * scale);

        // Render enemy health bar
        const l = this.dimensions[0] * 1.25 * scale / this.maxHealth * this.health;
        ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        ctx.fillRect(this.position[0] * scale + pos[0] - this.dimensions[0] * .125 * scale, this.position[1] * scale + pos[1] - 8, l, 5)
    }
}

export class MagicProjectile extends Client {
    /**
     * A regular magic projectile
     * @param {Number[]} position 
     * @param {Number[]} dimensions 
     * @param {Number[]} vel the x and y velocity of the projectile 
     * @param {Number} dmg The amount of damage on collision with the projectile 
     * @param {Number} size The size of the projectile 
     * @param {String} color a string containing a color (hex or name, most css named colors should work)
     */
    constructor(position, size, vel, speed, dmg, color) {
        super(position, [size, size]);
        this.projectile = {
            damage: dmg,
            color: color
        }
        this.velocity = vel;
        this.speed = speed;

        this.collision = {
            type: 'active', 
            shape: 'circle'
        }
    }

    /**
     * Change speed of projectile 
     * @param {Number[]} vel the x and y velocity of the projectile 
     */
    SetSpeed(vel) {
        this.velocity = vel;
    }

    /**
     * Run each frame, used for running things that HAS to run each frame
     * such as projectile movement 
     */
    Step() {
        this.position[0] += this.velocity[0] * this.speed;
        this.position[1] += this.velocity[1] * this.speed;
    }

    /**
     * Renderer for the object
     * @param {CanvasRenderingContext2D} ctx context to draw the object
     * @param {Number[]} offset x and y offset in pixels to draw the object 
     * @param {Number} scale ratio of units to pixels (scale = pixels/unit)
     */
    Render(ctx, offset, scale) {
        const pos = offset;
        const [x, y] = this.position;

        const o = this;
        const vel = o.velocity;
        const r = o.dimensions[0] * scale / 2;

        ctx.beginPath();
        ctx.arc(o.position[0] * scale + pos[0] , o.position[1] * scale + pos[1] , r, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for(let j = 0; j < 7; j++) {
            ctx.beginPath();
            ctx.arc(o.position[0] * scale + pos[0] - vel[0] * j *scale * .2, o.position[1] * scale + pos[1] - vel[1] *  j * scale * .2 , r, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    Collision(ev) {
        ev.grid.Remove(this);
        this.grid.InsertClient(new ExplosionParticle(this.position, this.dimensions, [this.dimensions[0], 2.5 * this.dimensions[0]], 10));

        // Damage hit objects 
        for(let i = 0; i < ev.objects.length; i++) {
            if(!ev.objects[i].health) continue;
            ev.objects[i].health -= this.projectile.damage;
            if(ev.objects[i].health <= 0) {
                this.grid.Remove(ev.objects[i]);

                if(ev.objects[i] instanceof PlayerClient) {
                    alert('you died')
                    const o = ev.objects[i];
                    o.health = o._maxHealth;
                    this.grid.InsertClient(o);
                }
            }
        }
    }
}

class ExplosionParticle extends Client {
    constructor(position, dimensions, radi, duration) {
        super(position, dimensions);
        this.frame = 0;
        this.radi = radi;
        this.duration = duration;
        this.collision.type = 'none';
    }

    Render(ctx, offset, scale) {
        // destroy the explosion particle at the end of the animation
        if(this.frame >= this.duration) {
            this.grid.Remove(this); 
            return;
        }
        
        const r = (this.radi[0] + this.frame * ((this.radi[1] - this.radi[0]) / this.duration)) * scale / 2;
        const x = this.position[0] * scale + offset[0],
            y = this.position[1] * scale + offset[1];
        

        ctx.beginPath();
        ctx.arc(x, y , r, 0, 2 * Math.PI);

        const opacity = .8 - .4 * (this.frame / this.duration);
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fill();

        this.frame++;   
    }
}