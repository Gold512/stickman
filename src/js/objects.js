import {math} from './math.js';
import {Client} from './spacial_hash.js';
import { saveToStorage } from './save.js';

const diagonalScaling = Math.pow(Math.sqrt(2), -1);

export class PlayerClient extends Client {
    constructor(position, dimensions, bars) {
        super(position, dimensions);
        this.bars = bars;
        
        this.facing = 'right';

        this.stats = {
            health: 20,
            maxHealth: 20,
            healthRegen: 1,
            mana: 50,
            maxMana: 50,
            manaRegen: 5,
            skillPoints: 0, 
            xp: 0,
            maxXp: 10,
            level: 1
        }

        this._regen = {health: 0, mana: 0};

        this.modifier = {};

        // autosave every 30s
        setInterval(() => {
            console.log('autosaving')
            saveToStorage(this)
        }, 30e3)
    }

    // Mana and health regen
    Step(t) { 
        if(this.stats.health < this.stats.maxHealth) this._regen.health += (t / 1000) * this.stats.healthRegen;
        if(this.stats.mana < this.stats.maxMana) this._regen.mana += (t / 1000) * this.stats.manaRegen;

        const keys = {
            health: 'maxHealth',
            mana: 'maxMana'
        };

        for(let i in this._regen) {
            if(this._regen[i] >= 1) {
                const regen = Math.trunc(this._regen[i]);
                this[i] += regen;
                this._regen[i] -= regen;
            }

            if(this.stats[i] > this.stats[keys[i]]) {
                this[i] = this.stats[keys[i]];
                this._regen[i] = 0;
            }
        }

        this.modifier.duration -= t;
        if(this.modifier.duration <= 0) this.modifier = {};
        if(this.modifier.callback) this.modifier.callback(this);
    }

    Move(keys, distance) {
        if(this.modifier.noMove) return;
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
                this.facing = 'right';
            } else  {
                this.position[0] -= distance;
                this.facing = 'left';
            }
        }
    }

    Render(ctx, offset, scale) {
        const pos = offset;
        // Render player 
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(this.position[0] * scale + pos[0], this.position[1] * scale + pos[1], this.dimensions[0] * scale, this.dimensions[0] * scale);
    }

    // SetStats(stats) {
    //     if(!stats) {
    //         this.stats = {

    //         };

    //         return;
    //     }
    //     this.stats = stats;
    // }

    UpdateStats() {
        this.maxHealth = this.stats.maxHealth;
        this.maxMana = this.stats.maxMana;
        this.maxXp = this.stats.maxXp;

        this.health = this.stats.health;
        this.mana = this.stats.mana;
        this.xp = this.stats.xp;
        this.level = this.stats.level;
    }

    _LevelUp(v) {
        let levelsGained = 0;
        while(v >= this.stats.maxXp) {
            v -= this.stats.maxXp;
            levelsGained++;
        }

        this.stats.skillPoints += levelsGained;
        this.level += levelsGained;

        // Update stats 
        this.maxHealth = this.level * 20;
        this.health += levelsGained * 20;

        this.maxMana = this.level * 50;
        this.mana += levelsGained * 50;

        this.healthRegen = this.level * 1;
        this.manaRegen = this.level * 5;

        this.maxXp = (this.level - 1) * 3 + 10;

        this.stats.xp = 0;
        this.bars.xp.style.setProperty('--current', 0);
        
        saveToStorage(this);
    }

    set health(v) {
        this.stats.health = v;
        this.bars.health.style.setProperty('--current', v)
    }

    get health() { return this.stats.health; }

    set maxHealth(v) {
        this.stats.maxHealth = v;
        this.bars.health.style.setProperty('--max', v)
    }

    get maxHealth() { return this.stats.maxHealth; }

    set mana(v) {
        this.stats.mana = v;
        this.bars.mana.style.setProperty('--current', v)
    }

    get mana() { return this.stats.mana; }

    set maxMana(v) {
        this.stats.maxMana = v;
        this.bars.mana.style.setProperty('--max', v)
    }

    get maxMana() { return this.stats.maxMana; }


    set xp(v) {
        this.stats.xp = v;
        this.bars.xp.style.setProperty('--current', v);

        if(v >= this.stats.maxXp) this._LevelUp(v);
    }

    get xp() { return this.stats.xp; }

    set maxXp(v) {
        this.stats.maxXp = v;
        this.bars.xp.style.setProperty('--max', v)
    }

    get maxXp() { return this.stats.maxXp; }

    set level(v) {
        this.bars.level.innerText = v;
        this.stats.level = v;
    }

    get level() { return this.stats.level; }

    set manaRegen(v) { this.stats.manaRegen = v; }
    get manaRegen() { return this.stats.manaRegen; }

    set healthRegen(v) { this.stats.healthRegen = v; }
    get healthRegen() { return this.stats.healthRegen; }
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
        this.grid.InsertClient(new MagicProjectile([cx + vector[0] + .5 * this.dimensions[0], cy + vector[1] + .5 * this.dimensions[1]], .5, vector, .3, 1, 'black'));

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
            let regenerate; // Whether to generate a new action or not 
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
     * @chainable this
     */
    SetSpeed(vel) {
        this.velocity = vel;
        return this;
    }

    /**
     * Rotate projectile velocity
     * @param {Number} ang amount of degrees to rotate
     * @chainable true
     */
    Rotate(ang) {
        const vec = this.velocity;
        ang = -ang * (Math.PI/180);
        let cos = Math.cos(ang);
        let sin = Math.sin(ang);
        this.vector = new Array(Math.round(10000*(vec[0] * cos - vec[1] * sin))/10000, Math.round(10000*(vec[0] * sin + vec[1] * cos))/10000);
        return this;
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

        // const grd = ctx.createRadialGradient(x * scale + pos[0], y * scale + pos[1], r, x * scale + pos[0], y * scale + pos[1], r + .2 * scale)
        // grd.addColorStop(0, 'rgba(0, 0, 0, .8)');
        // grd.addColorStop(.5, 'rgba(0, 0, 0, .8)');
        // grd.addColorStop(.85, 'rgba(0, 0, 0, .4)');
        // grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        // ctx.fillStyle = grd;
        // ctx.fillRect(x * scale + pos[0] - (r + .2 * scale), y * scale + pos[1] - (r + .2 * scale), 2*(r + .2 * scale), 2*(r + .2 * scale));

        let path = new Path2D();
        path.arc(x * scale + pos[0], y * scale + pos[1], r, 0, 2 * Math.PI);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill(path);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';

        // Generate trail for the projectile 
        // Note that x and y are in grid tiles and have to be converted to pixels
        for(let j = 0; j < 7; j++) {
            ctx.beginPath();
            ctx.arc(x * scale + pos[0] - vel[0] * j * scale * .2, y * scale + pos[1] - vel[1] * j * scale * .2 , r, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Reset style changes 
        ctx.fillStyle = null;
    }

    Collision(ev) {
        let remove = true;
        const owner = this.grid.GetClientById(this.owner);
        // Damage hit objects 
        for(let i = 0; i < ev.objects.length; i++) {
            const o = ev.objects[i];

            // If it collides with another bullet make both explode with larger radius
            if(o instanceof MagicProjectile) {
                if(this.owner && this.owner == o.owner) {
                    remove = false;
                    continue;
                }

                const x1 = this.position[0] + .5 * this.dimensions[0];
                const y1 = this.position[1] + .5 * this.dimensions[1];

                const x2 = o.position[0] + .5 * o.dimensions[0];
                const y2 = o.position[1] + .5 * o.dimensions[1];

                this.grid.InsertClient(new ExplosionParticle([(x1 + x2) / 2, (y1 + y2) / 2], this.dimensions, [this.dimensions[0], 5 * this.dimensions[0]], 15));
                this.grid.Remove(o);
                ev.grid.Remove(this);
                return;
            }

            remove = true;

            if(!o.health) continue;
            o.health -= this.projectile.damage;
            if(o.health <= 0) {
                this.grid.Remove(o);

                if(o instanceof PlayerClient) {
                    alert('you died')
                    o.health = o.maxHealth;
                    this.grid.InsertClient(o);
                } else if(owner && owner instanceof PlayerClient) {
                    // If killed by player award xp to player
                    owner.xp += o.xp || 1;
                }
            }
        }

        if(remove) {
            ev.grid.Remove(this);
            this.grid.InsertClient(new ExplosionParticle(this.position, this.dimensions, [this.dimensions[0], 2.5 * this.dimensions[0]], 10));
        }
    }
}

export class Shield extends Client {
    constructor(position, dimensions, owner, health) {
        super(position, dimensions);
        this.health = health;
        this.owner = owner;
        this.direction = 1; // direction (either 1 or -1)

        this.velocity = [ , ];
        this.projectile = false;
        this.speed = .25;
        // 1  : right
        // -1 : left
        // this.collision.type= 'none';
    }

    Step() {
        if(this.projectile) {
            this.position[0] += this.velocity[0] * this.speed;
            this.position[1] += this.velocity[1] * this.speed;
            return;
        }
        const owner = this.grid.GetClientById(this.owner);
        let [cx, cy] = owner.GetCenter();
        this.direction = owner.facing == 'right' ? 1 : -1;
        cx += this.direction * owner.dimensions[0] - .5 * this.dimensions[0];
        cy -= this.dimensions[1] * .5;
        this.position = [cx, cy];
    }

    Render(ctx, offset, scale) {
        const x = this.dimensions[0];
        const y = this.dimensions[1] * .5;

        // Generate an arc which intersects corner of bounding box of object
        const r = (x*x + y*y) / (2 * x);
        // center of arc
        let center = [this.position[0] - r * this.direction + (this.direction == 1 ? this.dimensions[0] : 0), this.position[1] + y];
        const angle = Math.asin(y/r);
        let startAng = 1 * 2 * Math.PI - angle, endAng = 1 * 2 * Math.PI + angle;

        // If it is left, mirror the angles and center point
        if(this.direction == -1) {
            startAng -= Math.PI;
            endAng -= Math.PI;
        }

        ctx.beginPath();
        //console.log(center, r, startAng, endAng);
        ctx.arc(center[0] * scale + offset[0], center[1] * scale + offset[1], r * scale, startAng, endAng);

        ctx.strokeStyle = 'black';
        ctx.lineWidth = .1 * scale;
        ctx.lineCap = 'round';
        ctx.stroke();

        // ctx.fillStyle = 'rgb(200, 50, 50)';
        // ctx.fillRect(this.position[0] * scale + offset[0], this.position[1] * scale + offset[1], this.dimensions[0] * scale, this.dimensions[1] * scale);
    }

    OnRemove() {
        const owner = this.grid.GetClientById(this.owner);
        owner.shield = null;
    }

    Collision(ev) {
        const owner = this.grid.GetClientById(this.owner);
        for(let i = 0; i < ev.objects.length; i++) {
            const o = ev.objects[i];
            if(o instanceof MagicProjectile) return;
            if(!o.health) return;
            o.health -= this.damage;
            if(o.health <= 0) {
                this.grid.Remove(o);
                if(o instanceof PlayerClient) {
                    o.health = o.maxHealth;
                    this.grid.InsertClient(o);
                } else if(owner && owner instanceof PlayerClient) {
                    // If killed by player award xp to player
                    owner.xp += o.xp || 1;
                }
            }
        }

        const s = Math.max(this.dimensions[0], this.dimensions[1]);
        this.grid.InsertClient(new ExplosionParticle(this.position, this.dimensions, [s, 2.5 * s], 10));

        this.grid.Remove(this);
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