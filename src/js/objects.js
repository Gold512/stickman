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
        this.skillPoints = 0;

        this._xp = 0;
        this._maxXp = 10;
        this._level = 1;

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

    set maxHealth(v) {
        this._maxHealth = v;
        this.bars.health.style.setProperty('--max', v)
    }

    get maxHealth() { return this._maxHealth; }

    set mana(v) {
        this._mana = v;
        this.bars.mana.style.setProperty('--current', v)
    }

    get mana() { return this._mana; }

    set maxMana(v) {
        this._maxMana = v;
        this.bars.mana.style.setProperty('--max', v)
    }

    get maxMana() { return this._maxMana; }


    set xp(v) {
        let levelsGained = 0;
        while(v >= this._maxXp) {
            v -= this._maxXp;
            levelsGained++;
        }

        this.skillPoints += levelsGained;
        this.level += levelsGained;

        this._xp = v;
        this.bars.xp.style.setProperty('--current', v);

        // Update stats 
        this.maxHealth = this.level * 20;
        this.health += levelsGained * 20;

        this.maxMana = this.level * 50;
        this.mana += levelsGained * 50;

    }

    get xp() { return this._xp; }

    set maxXp(v) {
        this._maxXp = v;
        this.bars.xp.style.setProperty('--max', v)
    }

    get maxXp() { return this._maxXp; }

    set level(v) {
        this.bars.level.innerText = v;
        this._level = v;
    }

    get level() { return this._level; }

    
}

export class Enemy extends Client {
    constructor(position, dimensions) {
        super(position, dimensions);
        this.action = {};
        this.speed = .03;
        this.velocity = [0, 0];

        this.maxHealth = 5;
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

        if(this.bounds) {
            let regenerate;
            const [topLeft, bottomRight] = this.bounds;
            if(topLeft[0] >= this.position[0]) {
                this.velocity[0] = s;
                regenerate = true;
            } else if(bottomRight[0] <= this.position[0] + this.dimensions[0]) {
                this.velocity[0] = -s;
                regenerate = true;
            }

            if(topLeft[1] >= this.position[1]) {
                this.velocity[1] = s;
                regenerate = true;
            } else if(bottomRight[1] <= this.position[1] + this.dimensions[1]) {
                this.velocity[1] = -s;
                regenerate = true;
            }

            if(Math.abs(this.velocity[0]) == s && Math.abs(this.velocity[1]) == s) this.velocity = [this.velocity[0] * diagonalScaling, this.velocity[1] * diagonalScaling];
            
            if(regenerate) {
                this.action.direction = math.rand_int(1, 8);
                this.action.time = math.rand_int(150, 500);
            }
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

    OnRemove() {
        if(!this.spawner) return;
        this.grid.GetClientById(this.spawner).killed++;
    }
}

export class Spawner extends Client {
    constructor(position, bounds, objectGenerator, count) {
        super(position, [1, 1]);

        this.collision.type = 'none';

        this.bounds = bounds;

        this.total = count;
        this._killed = 0;

        this.objectGenerator = objectGenerator;
        this.count = count;
    }

    Spawn() {
        for(let i = 0; i < this.count; i++) {
            const obj = this.objectGenerator();

            // Make spawned Client position relative to spawner
            obj.position[0] += this.position[0];
            obj.position[1] += this.position[1];
            obj.spawner = this.id;
            obj.bounds = [
                [this.position[0] - .5 * this.bounds[0], this.position[1] - .5 * this.bounds[1]],
                [this.position[0] + .5 * this.bounds[0], this.position[1] + .5 * this.bounds[1]]
            ];
            this.grid.InsertClient(obj);
        }
    }

    Render(ctx, offset, scale) {
        ctx.fillStyle = 'rgba(0, 0, 200, 1)';
        ctx.fillRect(this.position[0] * scale + offset[0], this.position[1] * scale + offset[1], this.dimensions[0] * scale, this.dimensions[1] * scale);
    }

    set killed(v) {
        this._killed = v;
        if(this._killed == this.total) {
            this.Spawn();
            this._killed = 0;
        }
    }

    get killed() { return this._killed; }
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

        const owner = this.grid.GetClientById(this.owner);
        // Damage hit objects 
        for(let i = 0; i < ev.objects.length; i++) {
            const o = ev.objects[i];

            // If it collides with another bullet make both explode with larger radius
            if(o instanceof MagicProjectile) {
                const x1 = this.position[0] + .5 * this.dimensions[0];
                const y1 = this.position[1] + .5 * this.dimensions[1];

                const x2 = o.position[0] + .5 * o.dimensions[0];
                const y2 = o.position[1] + .5 * o.dimensions[1];

                this.grid.InsertClient(new ExplosionParticle([(x1 + x2) / 2, (y1 + y2) / 2], this.dimensions, [this.dimensions[0], 5 * this.dimensions[0]], 15));
                this.grid.Remove(o);
                return;
            }

            if(!o.health) continue;
            o.health -= this.projectile.damage;
            if(o.health <= 0) {
                this.grid.Remove(o);

                if(o instanceof PlayerClient) {
                    alert('you died')
                    o.health = o._maxHealth;
                    this.grid.InsertClient(o);
                } else if(owner && owner instanceof PlayerClient) {
                    // If killed by player award xp to player
                    owner.xp += o.xp || 1;
                }
            }
        }
        
        this.grid.InsertClient(new ExplosionParticle(this.position, this.dimensions, [this.dimensions[0], 2.5 * this.dimensions[0]], 10));

    }
}

class ExplosionParticle extends Client {
    constructor(position, dimensions, radii, duration) {
        super(position, dimensions);
        this.frame = 0;
        this.radii = radii;
        this.duration = duration;
        this.collision.type = 'none';
    }

    Render(ctx, offset, scale) {
        // destroy the explosion particle at the end of the animation
        if(this.frame >= this.duration) {
            this.grid.Remove(this); 
            return;
        }
        
        const r = (this.radii[0] + this.frame * ((this.radii[1] - this.radii[0]) / this.duration)) * scale / 2;
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