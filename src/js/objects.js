import {math} from './math.js';
import {Client} from './spacial_hash.js';
import { saveToStorage } from './save.js';
import { collision } from './collision.js';
import { Vector } from './vector.js';
import { newInteractive } from './ui/interaction.js';

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
            level: 1,
            magic_affinity: 0
        }

        this._regen = {health: 0, mana: 0};

        this.modifier = {};

        // autosave every 30s
        setInterval(() => {
            console.log('autosaving')
            saveToStorage(this)
        }, 30e3);

        this.skills = new Set();
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
        if( (keys.up || keys.down) && (keys.left || keys.right) ) distance *= Math.SQRT1_2;

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

    /**
     * Update UI elements when stats are loaded 
     */
    UpdateStats() {
        this.maxHealth = this.stats.maxHealth;
        this.healthRegen = this.stats.healthRegen;
        this.maxMana = this.stats.maxMana;
        this.manaRegen = this.stats.manaRegen;
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

        this.healthRegen = this.level * .25;
        this.manaRegen = this.level * 5;

        this.maxXp = (this.level - 1) * 3 + 10;

        this.stats.xp = v;
        this.bars.xp.style.setProperty('--current', v);
        
        saveToStorage(this);
    }

    set health(v) {
        const diff = this.stats.health - v;
        this._regen.health = Math.min(-diff * 3, this._regen.health);

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

    set manaRegen(v) {
        this.bars.mana.style.setProperty('--regen', v)
        this.stats.manaRegen = v;
    }
    get manaRegen() { return this.stats.manaRegen; }

    set healthRegen(v) {
        this.bars.health.style.setProperty('--regen', v)
        this.stats.healthRegen = v;
    }
    get healthRegen() { return this.stats.healthRegen; }

    set magicAffinity(v) { 
        this.bars.magic_affinity.style.setProperty('--current', v);
        this.stats.magic_affinity = v;
    }
    get magicAffinity() { return this.stats.magic_affinity; }
}

export class Enemy extends Client {
    constructor(position, dimensions, {
        maxHealth = 5,
        maxMana = 25,
        healthRegen = .5,
        manaRegen = 2
    }={}) {
        super(position, dimensions);
        this.action = { time: 0 };
        this.speed = .05;
        this.velocity = [0, 0];

        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.healthRegen = healthRegen;

        this.maxMana = maxMana;
        this.mana = maxMana;
        this.manaRegen = manaRegen;

        this._regen = {mana: 0, health: 0}
        this.stats = {
            owner: this,
            get health() { return this.owner.health; },
            get mana() { return this.owner.mana; }
        }
    }

    ShootAt(pos) {
        const [x, y] = pos;
        const [cx, cy] = this.position;
        let vector = [x - cx, y - cy];
        const scaler = 1/Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        vector[0] *= scaler;
        vector[1] *= scaler;
        this.grid.InsertClient(new MagicProjectile([cx + vector[0] + .5 * this.dimensions[0], cy + vector[1] + .5 * this.dimensions[1]], .5, vector, .3, {dmg: 1, color: 'black'}));

    }

    Step(t) {
        /*================+
        | Movement engine |
        +=================+
        Event Priority - Projectile Dodge > Return to bounds > Wandering
        */

        // wandering 
        if(this.velocity[0] == 0 && this.velocity[1] == 0 && this.action.time <= 0) {
            const ang = math.rand_int(0, 360);
            this.velocity = Vector.create(1, ang);
            this.action.time = math.rand_int(200, 500);
        }

        // Return to bounds if idle 
        if(this.bounds && this.action.type != 'dodge') {
            const [topLeft, bottomRight] = this.bounds;

            // Distance nearer to center at which the enemy will attempt to return to bounds
            const dist = .3;
            let vel = [0, 0];

            // x direction 
            if(this.position[0] < topLeft[0] + dist) {
                vel[0] = 1
            } else if(this.position[0] > bottomRight[0] - dist) {
                vel[0] = -1;
            }

            // y direction
            if(this.position[1] < topLeft[1] + dist) {
                vel[1] = 1
            } else if(this.position[1] > bottomRight[1] - dist) {
                vel[1] = -1;
            }

            if(vel[0] != 0 && vel[1] != 0) vel = [vel * Math.SQRT1_2, vel * Math.SQRT1_2];
            if(!(vel[0] == 0 && vel[1] == 0)) this.velocity = vel;
        }

        // Auto dodge 
        const PROJECTION_DIST = 5;

        const objects = this.grid.ClientSelector({
            origin: this.position, 
            bounds: [6, 6], 
            type: MagicProjectile, 
            sort: 'nearest'
        });

        // this.grid.FindNear([this.position[0], this.position[1]], [6, 6]);
        for(let i = 0; i < objects.length; i++) {
            const e = objects[i];
            const vec = Vector.rotate(e.velocity, 90);
            const sideVect = [e.dimensions[0] * vec[0], e.dimensions[1] * vec[1]];
            
            const lx = PROJECTION_DIST * e.velocity[0];
            const ly = PROJECTION_DIST * e.velocity[1];
            // Create virtual rectangle rotated in the direction of the 
            // projectile's velocity and check the collision with self 
            // to predict if the projectile will collide
            const willCollide = collision.Polygon([
                {
                    x: e.position[0] - sideVect[0],
                    y: e.position[1] - sideVect[1]
                },
                {
                    x: e.position[0] + sideVect[0],
                    y: e.position[1] + sideVect[1]
                },
                {
                    x: e.position[0] + sideVect[0] + lx,
                    y: e.position[1] + sideVect[1] + ly
                },
                {
                    x: e.position[0] - sideVect[0] + lx,
                    y: e.position[1] - sideVect[1] + ly
                }
            ],
            [
                {
                    x: this.position[0], 
                    y: this.position[1]
                },
                {
                    x: this.position[0] + this.dimensions[0],
                    y: this.position[1]
                },
                {
                    x: this.position[0] + this.dimensions[0],
                    y: this.position[1] + this.dimensions[0]
                },
                {
                    x: this.position[0],
                    y: this.position[1] + this.dimensions[0]
                }
            ]);

            if(willCollide) {
                // Find closest edge of collision projection normal to the 
                // velocity of the projectile

                const c = this.GetCenter();

                const vect = Vector.normalise(sideVect);

                if(
                    ((e.position[0] - sideVect[0] - c[0])**2 + (e.position[1] - sideVect[1] - c[1])**2) <=
                    ((e.position[0] + sideVect[0] - c[0])**2 + (e.position[1] + sideVect[1] - c[1])**2)
                ) {
                    this.velocity[0] = -vect[0];
                    this.velocity[1] = -vect[1];
                } else {
                    this.velocity[0] = vect[0];
                    this.velocity[1] = vect[1];
                }

                this.action.time = 500;
                this.action.type = 'dodge'
                continue;
            }
        }

        // Velocity move 
        this.position[0] += this.velocity[0] * this.speed;
        this.position[1] += this.velocity[1] * this.speed;
        
        this.action.time -= t;
        if(this.action.time <= 0) {
            this.velocity = [0, 0];
            this.action.type = '';
        }

        /*==============+
        | Attack Engine |
        +==============*/

        // old basic attack engine while the new one is being developed
        if(math.rand_int(0, 500 / t) == 0) {
            let objects = this.grid.FindNear(this.position, [20, 20]);
            for(let i = 0; i < objects.length; i++) {
                if(objects[i] instanceof PlayerClient) {
                    this.ShootAt(objects[i].position)
                }
            }
            
        }

        // Handle mana regen
        if(this.health < this.maxHealth) this._regen.health += (t / 1000) * this.healthRegen;
        if(this.mana < this.maxMana) this._regen.mana += (t / 1000) * this.manaRegen;

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

        if(this.health > this.maxHealth) this.health = this.maxHealth;
        if(this.mana > this.maxMana) this.mana = this.maxMana;

        // Decide what to do randomly 
        // Giving more weightage to stronger attacks as the stick figure has more mana
        // or less health
        // Also use movement and defensive spells more to defend against attacks 
        // maybe destroy some projectiles that are easy to shoot with magic 
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
        const spawner = this.grid.GetClientById(this.spawner)
        if(spawner) spawner.killed++;
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

    Interaction(ev) {
        newInteractive('this is an interactive ui', {x: ev.client[0], y: ev.client[1]})
    }

    /**
     * Enemy spawning event
     */
    Spawn() {
        for(let i = 0; i < this.count; i++) {
            const obj = this.objectGenerator();
            const bounds = [
                [this.position[0] - .5 * this.bounds[0], this.position[1] - .5 * this.bounds[1]],
                [this.position[0] + .5 * this.bounds[0], this.position[1] + .5 * this.bounds[1]]
            ];

            if(obj.position == null) {
                // random position within bounds
                obj.position = [
                    math.rand_int(bounds[0][0], bounds[1][0]),
                    math.rand_int(bounds[0][1], bounds[1][1])
                ];

            } else {
                // Make spawned Client position relative to spawner
                obj.position[0] += this.position[0];
                obj.position[1] += this.position[1];
            }

            obj.spawner = this.id;
            obj.bounds = bounds;
            
            this.grid.InsertClient(obj);
        }
    }

    Render(ctx, offset, scale) {
        ctx.fillStyle = 'rgba(50, 50, 200, 1)';
        ctx.strokeStyle = 'rgba(0, 0, 140, 1)';
        ctx.lineWidth = 5;

        ctx.fillRect(this.position[0] * scale + offset[0], this.position[1] * scale + offset[1], this.dimensions[0] * scale, this.dimensions[1] * scale);
        ctx.strokeRect(this.position[0] * scale + offset[0], this.position[1] * scale + offset[1], this.dimensions[0] * scale, this.dimensions[1] * scale);

        ctx.fillStyle = null;
        ctx.strokeStyle = null;
        ctx.lineWidth = null;
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
     * @param {[Number, Number]} position 
     * @param {Number} options.size The size of the projectile 
     * @param {[Number, Number]} vel the x and y velocity of the projectile 
     * @param {Number} speed the speed of the projectile
     * @param {Object} options
     * @param {Number} options.dmg The amount of damage on collision with the projectile 
     * @param {String} options.color a string containing a color (hex or name, most css named colors should work)
     * @param {('top-left'|'center'|'bottom-right')} options.anchor The position of the position argument relative to the object
     */
    constructor(position, size, vel, speed, {
        dmg = 1,
        color = 'black',
        anchor = 'center'
    } = {}) {
        position = anchorPosition(anchor, position, size);

        super(position, [size, size]);
        this.projectile = {
            damage: dmg,
            color: color
        }
        this.velocity = vel;
        this.speed = speed;

        this.collision = {
            type: 'active', 
            shape: 'circle',
            solid: false
        }
    }

    /**
     * Change speed of projectile 
     * @param {[Number, Number]} vel the x and y velocity of the projectile 
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
     * @param {[Number, Number]} offset x and y offset in pixels to draw the object 
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
        path.arc(x * scale + pos[0] + r, y * scale + pos[1] + r, r, 0, 2 * Math.PI);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill(path);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';

        // Generate trail for the projectile 
        // Note that x and y are in grid tiles and have to be converted to pixels
        for(let j = 0; j < 7; j++) {
            ctx.beginPath();
            ctx.arc(x * scale + pos[0] - vel[0] * j * scale * .2 + r, y * scale + pos[1] - vel[1] * j * scale * .2 + r, r, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        // highlight collision box 
        // ctx.fillRect(this.position[0] * scale + pos[0], this.position[1] * scale + pos[1], this.dimensions[0] * scale, this.dimensions[1] * scale);


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

                const [x1, y1] = this.GetCenter();
                const [x2, y2] = o.GetCenter();

                this.grid.InsertClient(new ExplosionParticle([(x1 + x2) / 2, (y1 + y2) / 2], [this.dimensions[0], 5 * this.dimensions[0]], 15));
                this.grid.Remove(o);
                ev.grid.Remove(this);

                return;
            } 
            
            if(o instanceof Shield) {
                // bounce off shield 
                const c = this.GetCenter();
                // within y bounds, therefore either on the left or right side
                if(c[1] > o.position[1] && c[1] < o.position[1] + o.dimensions[1]) {
                    this.velocity[0] *= -1;
                } else if(c[0] > o.position[0] && c[0] < o.position[0] + o.dimensions[0]) {
                    this.velocity[1] *= -1;
                }

                o.health -= this.projectile.damage;

                if(o.health <= 0) this.grid.Remove(o);

                return
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
            this.grid.InsertClient(new ExplosionParticle(this.GetCenter(), [this.dimensions[0], 2.5 * this.dimensions[0]], 10));
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
        this.grid.InsertClient(new ExplosionParticle(this.GetCenter(), [s, 2.5 * s], 10));

        this.grid.Remove(this);
    }
}

class ExplosionParticle extends Client {
    constructor(position, diameters, duration, {
        anchor = "center"
    } = {}) {
        let dimension = Math.max(...diameters);
        let size = [dimension, dimension];
        position = anchorPosition(anchor, position, size)

        super(position, size);

        this.frame = 0;
        this.diameters = diameters;
        this.duration = duration;
        this.collision.type = 'none';
    }

    Render(ctx, offset, scale) {
        // this.showBoundingBox(ctx, offset, scale)
        // destroy the explosion particle at the end of the animation
        if(this.frame >= this.duration) {
            this.grid.Remove(this); 
            return;
        }
        const center = this.GetCenter();
        const r = .5 * (this.diameters[0] + this.frame * ((this.diameters[1] - this.diameters[0]) / this.duration)) * scale;
        const x = center[0] * scale + offset[0],
            y = center[1] * scale + offset[1];
        

        ctx.beginPath();
        ctx.arc(x, y , r, 0, 2 * Math.PI);

        const opacity = .8 - .4 * (this.frame / this.duration);
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fill();

        this.frame++;   
    }
}

export class RectSolid extends Client {
    constructor(position, dimensions) {
        super(position, dimensions);
        this.collision.type = 'active';
    }

    Collision(ev) {
        for(let i = 0; i < ev.objects.length; i++) {
            const o = ev.objects[i];
            if(!o.solid) return;


        }
    }
}

// Solid object represented by a convex polygon
export class PolySolid extends Client {
    /**
     * Create solid from convex list of points
     * @param {Object[]} points - list of points  
     * @param {Number} points[].x - x coord of point
     * @param {Number} points[].y - y coord of point
     */
    constructor(points) {
        if(points.length < 3) throw new Error('cannot construct polygonal figure from less then 3 points')
        // Find bounds and dimensions 
        // default values are in the maximum opposite directions of the points
        const topLeft = [Infinity, Infinity];
        const bottomRight = [-Infinity, -Infinity];

        for(let i = 0; i < points.length; i++) {
            const e = points[i];
            if(e.x > bottomRight[0]) bottomRight[0] = e.x
                else if(e.x < topLeft[0]) topLeft[0] = e.x;

            if(e.y > bottomRight[1]) bottomRight[1] = e.y
                else if(e.y < topLeft[1]) topLeft[1] = e.y;
        }

        super(topLeft, [
            Math.abs(topLeft[0] - bottomRight[0]),
            Math.abs(topLeft[1] - bottomRight[1])
        ]);
    }
}

/**
 * Positional anchor of object
 * @param {('top-left'|'center'|'bottom-right')} anchor - point to anchor to
 * @param {[Number, Number]} position - position of object to anchor 
 * @param {[Number, Number]} size - size of the object 
 * @returns {[Number, Number]} - numbered position
 */
function anchorPosition(anchor, position, size) {
    if(!Array.isArray(size)) size = [size, size];

    switch (anchor) {
        case 'top-left': return position;
        case 'center':
            position = [position[0] - .5 * size[0], position[1] - .5 * size[1]];
            break;
        case 'bottom-right':
            position = [position[0] - size[0], position[1] - size[1]];
            break;
        default: throw new Error('invalid position anchor')
    }
    return position;
}
