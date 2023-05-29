import {math} from '../module/math.js';
import {Client} from '../spacial_hash.js';
import { saveToStorage } from '../save.js';
import { newInteractive } from '../ui/interaction.js';
import { AI } from '../classes/AI.js';
import { Vector } from '../module/vector.js';
import { getOrbStats, speed } from '../module/calc.js';
import { enemyGenerators } from './enemies.js';
import { GROUPS } from '../const.js';

// base class with helper functions for moving clients
export class Character extends Client {
    constructor(position, dimensions) {
        super(position, dimensions);
    }

    VelocityTick() {
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];
    }

    // run collision function as entities instead (since they probably already have a step function)
    Collision(ev) { 
        const o = this;
        
        for(let i = 0; i < ev.objects.length; i++) {
            const e = ev.objects[i];
            if(!e.collision.solid) continue;

            const obj_c = o.GetCenter();
            
            // distances between object edges

            // distance between left edge of o and right edge of e
            const LR_diff = Math.abs(o.position[0] - (e.position[0] + e.dimensions[0]));
            
            // distance between top edge of o and bottom edge of e
            const TB_diff = Math.abs(o.position[1] - (e.position[1] + e.dimensions[1]));

            const RL_diff = Math.abs((o.position[0] + o.dimensions[0]) - e.position[0]);

            const BT_diff = Math.abs((o.position[1] + o.dimensions[1]) - e.position[1]);

            const min_y_diff = Math.min(TB_diff, BT_diff);
            const min_x_diff = Math.min(RL_diff, LR_diff);

            // check if the object collided from the right
            if( (obj_c[0] > center[0]) && (LR_diff < min_y_diff)) {
                o.position[0] = e.position[0] + e.dimensions[0];
                continue;
            } 
            
            // check if the object collided from the left
            if( (obj_c[0] < center[0]) && (RL_diff < min_y_diff) ) {
                o.position[0] = e.position[0] - o.dimensions[0];
                continue;
            }
            

            // check if collided from top
            if( (obj_c[1] < center[1]) && (BT_diff < min_x_diff) ) {
                o.position[1] = e.position[1] - o.dimensions[1];
                if(o._gravity !== undefined) o._gravity = 0;
                if(o.onGround === false) o.onGround = true;
                continue;
            }

            // check if collided from bottom
            if( (obj_c[1] > center[1]) && (TB_diff < min_x_diff) ) {
                o.position[1] = e.position[1] + e.dimensions[1];
                continue;
            }
        }
    }
}

export class PlayerClient extends Client {
    constructor(position, dimensions, bars) {
        super(position, dimensions);
        this.velocity = [0,0]
        this.bars = bars;
        this.gravity = true;
        
        this.facing = 'right';

        this.stats = {
            health: 100,
            maxHealth: 100,
            healthRegen: 1,
            mana: 50,
            maxMana: 50,
            manaRegen: 5,
            skillPoints: 0, 
            xp: 0,
            maxXp: 10,
            level: 1,
            magicAffinity: 0,
            mpl: 1
        }

        this._regen = {health: 0, mana: 0};

        this.modifier = null;

        // autosave every 30s
        setInterval(() => {
            console.log('autosaving')
            saveToStorage(this)
        }, 30e3);

        this.skills = new Set();
        this.onGround = false;

        this.collision = {
            type: 'active',
            shape: 'rectangle',
            solid: true 
        }
    }

    // Mana and health regen
    Step(t) { 
        if(this.stats.health < this.stats.maxHealth) this._regen.health += (t / 1000) * this.stats.healthRegen;
        if(this.stats.mana < this.stats.maxMana) this._regen.mana += (t / 1000) * this.stats.manaRegen;

        // update sub-health bar 
        if(this._regen.health < 0) {
            this.bars.health.style.setProperty('--percent', Math.abs(this._regen.health))
        } else {
            this.bars.health.style.setProperty('--percent', 0)
        }

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

        if(!this.modifier) return;
        this.modifier.duration -= t;
        if(this.modifier.duration <= 0) {
            let onComplete = this.modifier.onComplete;
            this.modifier = null;
            if(onComplete) onComplete.bind(this)();
        } else if(this.modifier.callback) this.modifier.callback.bind(this)(t);

    }

    Move(keys, t) {
        let {up, down, left, right} = keys;

        const noGravity = this.HasTag('NoGravity');

        // time in seconds
        const ts = t * 0.001;
        const jumping = (!noGravity) && (this.onGround === false);

        if(jumping) {
            // allow smaller jumps 
            if(up == false) this._gravity += 10 * t/1000;
            // prevent up and down movement while in the air
        }

        this.onGround = false;
        
        let vel = 1;
        const JUMP_HEIGHT = 1;

        if(this.modifier && this.modifier.noMove) return;
        if(jumping || ((up || down) && !(up && down) && 
        (left || right) &&  !(left && right))) vel = Math.SQRT1_2;

        if(!jumping) {
            if( !(up && down) && (up || down)) {
                if(down) {
                    this.velocity[1] = JUMP_HEIGHT;
                } else  {
                this.velocity[1] = -JUMP_HEIGHT;
                }
            
            } else { this.velocity[1] = 0; }
        }

        if( !(left && right) && (left || right) ) {
            if(right) {
                this.velocity[0] = vel;
                this.facing = 'right';
            } else  {
                this.velocity[0] = -vel;
                this.facing = 'left';
            }
        } else { this.velocity[0] = 0; }

        this.position[0] += this.velocity[0] * this.speed * ts;
        this.position[1] += this.velocity[1] * this.speed * ts;
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
        this.magicAffinity = this.stats.magicAffinity;
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
        this.bars.health.style.setProperty('--current', v);
        this.stats.health = v;

        const healthRegenCd = Math.min(-diff * 3, this._regen.health);
        if(healthRegenCd >= 0) return;

        this._regen.health = healthRegenCd;
        this.bars.health.style.setProperty('--total', -healthRegenCd);
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
        this.bars.magicAffinity.style.setProperty('--current', v);
        this.stats.magicAffinity = v;

        let affinity = mpl => (100-34) + Math.round((mpl + 2)**3.8)
        let requiredAffinity = affinity(this.mpl);

        while(v >= requiredAffinity) {
            v -= requiredAffinity;
            this.stats.mpl++;
            if(v >= requiredAffinity) requiredAffinity = affinity(this.mpl);
        }

        this.bars.magicAffinity.style.setProperty('--current', v);
        this.bars.magicAffinity.style.setProperty('--max', affinity(this.mpl));
        this.stats.magicAffinity = v;
        this.mpl = this.stats.mpl; // update mpl UI elements
    }

    get magicAffinity() { return this.stats.magicAffinity; }

    set mpl(v) {
        this.bars.magicAffinity.style.setProperty('--mpl', v);
        this.stats.mpl = v;
    }

    get mpl() { return this.stats.mpl; }

    OnRemove() {
        this.health = this.maxHealth;
        this.grid.InsertClient(this);
        alert('you died')
    }

    toJSON() {
        return false;
        
        
        //     constructor: this.constructor.name,
            
        //     position: this.position,
        //     dimensions: this.dimensions,

        //     maxHealth: this.maxHealth,
        //     health: this.health,
        //     healthRegen: this.healthRegen,

        //     maxMana: this.maxMana,
        //     mana: this.mana,
        //     manaRegen: this.manaRegen,

        //     mpl: this.mpl,
        //     magicAffinity: this.magicAffinity,

        //     speed: this.speed,
        //     velocity: this.velocity
        // }
    }
}

export class Enemy extends Client {
    /**
     * 
     * @param {[number,number]} position 
     * @param {[number,number]} dimensions 
     * 
     * @param {object} options 
     * @param {number} options.maxHealth
     * @param {number} options.maxMana
     * @param {number} options.healthRegen
     * @param {number} options.manaRegen
     * @param {number} options.mpl
     * @param {string} options.color
     * @param {object} options.ai - config for ai settings
     */
    constructor(position, dimensions, {
        maxHealth = 20,
        maxMana = 25,
        healthRegen = .2,
        manaRegen = 2,
        mpl = 1,
        color = 'rgba(200, 0, 0, 1)',
        skills = [],
        ai
    }={}) {
        super(position, dimensions);
        this.speed = 3;
        this.velocity = [0, 0];
        this.gravity = true;

        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.healthRegen = healthRegen;

        this.maxMana = maxMana;
        this.mana = maxMana;
        this.manaRegen = manaRegen;

        this.mpl = mpl;

        this.color = color;
        this.skills = skills;

        this._regen = {mana: 0, health: 0}
        this.stats = {
            owner: this,
            get health() { return this.owner.health; },
            get mana() { return this.owner.mana; }
        }

        if(ai && !(ai instanceof AI)) {
            if((typeof ai !== 'object')) throw new TypeError('AI parameter is not an object or an instance of AI');
            ai = new AI(this, ai);
        }

        let aiConfig = ai?.config || {
            wander: true,
            stayWithin: true,
            dodge: 'low'
        };

        this.AI = ai || new AI(this, aiConfig);

        this.collision.solid = true;
        this.collision.type = 'active';
    }

    Step(t) {
        this.AI.Tick(t);

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

        // Velocity move 
        /*
            speed: tiles/s
            t: time(ms) 
        */
        const ts = t * 0.001;
        this.position[0] += this.velocity[0] * this.speed * ts;
        this.position[1] += this.velocity[1] * this.speed * ts;

        // Decide what to do randomly 
        // Giving more weightage to stronger attacks as the stick figure has more mana
        // or less health
        // Also use movement and defensive spells more to defend against attacks 
        // maybe destroy some projectiles that are easy to shoot with magic 
    }

    Render(ctx, offset, scale) {
        const pos = offset;
        // Render player 
        ctx.fillStyle = this.color;

        ctx.fillRect(this.position[0] * scale + pos[0], this.position[1] * scale + pos[1], this.dimensions[0] * scale, this.dimensions[1] * scale);

        // Render enemy health bar
        const tl = this.dimensions[0] * 1.25 * scale;
        const l = Math.max(tl / this.maxHealth * this.health, 0);
        const health_bar = [this.position[0] * scale + pos[0] - this.dimensions[0] * .125 * scale, this.position[1] * scale + pos[1] - 10];
        
        ctx.fillStyle = 'rgba(120, 120, 120, 1)';
        ctx.fillRect(health_bar[0], health_bar[1], tl, 5);

        ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        ctx.fillRect(health_bar[0], health_bar[1], l, 5);

        ctx.strokeStyle = 'rgba(80, 80, 80)';
        ctx.lineWidth = 3
        ctx.strokeRect(health_bar[0] - 1, health_bar[1] - 1, tl + 2, 7)

        // Render enemy display name 
        // ctx.font = `${.25 * scale}px serif`;
        // ctx.fillText('Hello world', this.position[0] * scale + pos[0] - this.dimensions[0] * .125 * scale, this.position[1] * scale + pos[1] - 12);
    }

    OnRemove() {
        if(!this.spawner) return;
        const spawner = this.grid.GetClientById(this.spawner)
        if(spawner) {
            spawner.spawned.delete(this.id);
            spawner.killed++;
        }
    }

    toJSON() {
        return {
            constructor: this.constructor.name,
            
            position: this.position,
            dimensions: this.dimensions,

            maxHealth: this.maxHealth,
            health: this.health,
            healthRegen: this.healthRegen,

            maxMana: this.maxMana,
            mana: this.mana,
            manaRegen: this.manaRegen,

            mpl: this.mpl,
            AIConfig: this.AIConfig,

            speed: this.speed,
            velocity: this.velocity,
            ai: this.AI.config,
            color: this.color,
            skills: this.skills
        }
    }

    static from(json) {
        const position = json.position;
        const dimensions = json.dimensions;
        delete json.position;
        delete json.dimensions;

        return new this(position, dimensions, json)
    }
}

export class Spawner extends Client {
    /**
     * 
     * @param {[number,number]} position 
     * @param {[number, number]} bounds 
     * @param {object} options
     * @param {object} [options.objectGenerator] - definition of a spawning function
     * @param {} [options.objectGenerator.name] - name of the generator function
     * @param {any[]} [options.objectGenerator.args] - params of the generator function
     *  use '$' prefix to reference property of spawner (ie $var translates to this.var)
     * @param {number} options.count 
     * @param {string} [type] - used to store spawn type information if needed
     */
    constructor(position, {bounds, objectGenerator, count, type}) {
        super(position, [1, 1]);

        this.collision.type = 'none';

        this.bounds = bounds;

        this.total = count;
        this._killed = 0;

        this.objectGenerator = objectGenerator;
        this.count = count;

        this.spawned = new Set();
        this.type = type||'beginner'
    }

    OnFocusBeforeRender(ctx, offset, scale) {
        if(!this.bounds) return;
        ctx.fillStyle = 'rgb(255, 20, 20, .3)';
        const center = this.GetCenter();
        ctx.fillRect(
            (center[0] - .5 * this.bounds[0]) * scale + offset[0],
            (center[1] - .5 * this.bounds[1]) * scale + offset[1],
            this.bounds[0] * scale,
            this.bounds[1] * scale);
        ctx.fillStyle = null;
    }

    Interaction(ev) {
        newInteractive('Spawning Portal (Showing enemy bounds)', {x: ev.client[0], y: ev.client[1],
            onClose() {
                ev.onClose();
            }, 
            options: [
                {
                    text: ['beginner', 'rookie', 'intermediate', 'expert', 'master', 'legend', 'myth'],
                    type: 'scroll',
                    callback: (ev, option) => {
                        this.type = option;
                    }
                },
                {
                    close: true,
                    text: 'Force spawn',
                    callback: () => this.Spawn()
                }
            ]
        })
    }

    /**
     * Enemy spawning event
     */
    Spawn() {
        for(let i = 0, arr = Array.from(this.spawned); i < arr.length; i++) {
            const client = this.grid.GetClientById(arr[i]);
            this.total = Infinity;
            if(client) this.grid.Remove(client);
            this.total = this.count; 
        }
        
        let args = this.ParseGeneratorFunctionArgs()
        
        for(let i = 0; i < this.count; i++) {
            let obj = this.InvokeGeneratorFunction(this.objectGenerator.name, args)
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
            console.log(obj)
            this.grid.InsertClient(obj);

            this.spawned.add(obj.id);
        }
    }

    /**
     * Safely create and return a new enemy perfoming object cloning as needed+ 
     * @param {string} name name of the generator function
     * @param {any[]} args params of the generator function
     * @returns {Enemy}
     */
    InvokeGeneratorFunction(name, args) {
        return enemyGenerators[name](...structuredClone(args));
    }

    ParseGeneratorFunctionArgs() {
        let args = structuredClone(this.objectGenerator.args);

        // resolve relative references
        for(let i = 0; i < args.length; i++) {
            if(typeof args[i] === 'string' && args[i][0] === '$') {
                let propertyName = args[i].slice(1);
                args[i] = this[propertyName];
            }
        }   

        return args
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

    toJSON() {
        return {
            constructor: this.constructor.name,
            
            position: this.position,
            bounds: this.bounds,
            count: this.count,
            objectGenerator: this.objectGenerator,
            type: this.type
        }
    }

    static from(json) {
        return new this(json.position, json);
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
     * @param {String} options.owner ID of creator of the projectile
     * @param {('top-left'|'center'|'bottom-right')} options.anchor The position of the position argument relative to the object
     */
    constructor(position, size, vel, speed, {
        dmg = 1,
        color = 'black',
        anchor = 'center',
        owner = null,
        curve = null,
        mpl = null
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

        if(owner) this.owner = owner;
        if(curve) {
            const circumference = 2 * Math.PI * curve.radius;
            this.curve = {
                circumference: circumference,
                angle: curve.angle,
                center: curve.center,
                radius: curve.radius,
                angleChange: curve.direction * (this.speed / circumference) * 360,
                distanceTraveled: curve.distance
            };
        };

        if(!mpl) throw new Error('no mpl specified');
        this.mpl = mpl;

        this.group = GROUPS.PROJECTILE;
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
    Step(t) {
        const ts = t * 0.001;

        if(this.curve) {
            const d = this.curve.angleChange * ts;
            this.curve.angle += d;
            this.curve.distanceTraveled += Math.abs(d);
            if(this.curve.angle > 360) this.curve.angle -= 360;
            const vector = Vector.create(this.curve.angle);
            this.velocity = Vector.rotate(vector, -90);
            
            this.position = Vector.add(this.curve.center, Vector.multiply(vector, this.curve.radius));
            if(this.curve.distanceTraveled > 270) this.grid.Remove(this);
            return;
        }

        this.position[0] += this.velocity[0] * this.speed * ts;
        this.position[1] += this.velocity[1] * this.speed * ts;
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


        // render curved path trail 
        if(this.curve) {
            ctx.lineCap = 'round';
            ctx.lineWidth = scale * this.dimensions[0];

            // half a second distance worth of trail
            const ang1 = Vector.DEG_TO_RAD_SCALE * (this.curve.angle - .2 * this.curve.angleChange),
                ang2 = Vector.DEG_TO_RAD_SCALE * this.curve.angle;

            // const grd = ctx.createConicGradient(
            //     this.position[0] * scale + offset[0],
            //     this.position[1] * scale + offset[1],
            //     0,
            //     math.PI * 2
            // );

            // grd.addColorStop(0, 'rgba(0,0,0, .5)');
            // grd.addColorStop(.9, 'rgba(0,0,0, .15)');
            // grd.addColorStop(1, 'rgba(0,0,0, 0)');

            ctx.strokeStyle = 'rgba(0,0,0, .5)';

            
            ctx.beginPath();
            ctx.arc((this.curve.center[0] + this.dimensions[0] * .5) * scale + offset[0], (this.curve.center[1] + this.dimensions[1] * .5) * scale + offset[1], this.curve.radius * scale, Math.min(ang1, ang2), Math.max(ang1, ang2));
            ctx.stroke();

            ctx.strokeStyle = null;
            ctx.lineCap = null;
            
            return;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        // Generate trail for the projectile 
        // Note that x and y are in grid tiles and have to be converted to pixels
        for(let j = 0; j < 7; j++) {
            ctx.beginPath();
            ctx.arc(x * scale + pos[0] - vel[0] * j * scale * .2 + r, y * scale + pos[1] - vel[1] * j * scale * .2 + r, r, 0, 2 * Math.PI);
            ctx.fill();
        }

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
                if(this.owner && !this.curve && this.owner == o.owner) {
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
                
                if(owner && owner instanceof PlayerClient) {
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

    toJSON() {
        let o = {
            constructor: this.constructor.name,
            position: this.position,
            size: this.dimensions[0],

            projectile: this.projectile,
            velocity: this.velocity,
            speed: this.speed,
            curve: this.curve,
            mpl: this.mpl
        }

        if(this.owner) o.owner = this.owner;
        return o;
    }

    // TODO: have to fix owner reference being lost as IDs are not preserved
    static from(json) {
        return new this(json.position, json.size, json.velocity, json.speed, {
            dmg: json.projectile.damage,
            color: json.projectile.color,
            mpl: json.mpl,
            curve: json.curve,
            anchor: 'top-left'
        })
    }
}

export class RecursiveMagicProjectile extends MagicProjectile {
    constructor(position, size, vel, speed, {
        dmg = 1,
        color = 'black',
        anchor = 'center',
        owner = null,
        splitAt,
        mpl
    } = {}) {
        super(position, size, vel, speed, {dmg, color, anchor, owner, mpl});
        if(!splitAt) throw new Error('no position to split at provided');
        this.splitAt = splitAt;
    }

    Step(t) {
        // move based on velocity
        const ts = t * 0.001;
        this.position[0] += this.velocity[0] * this.speed * ts;
        this.position[1] += this.velocity[1] * this.speed * ts;

        const p1 = this.GetCenter(), p2 = this.splitAt;
        const v = this.velocity;

        const x_polarity = this._GetPolarity(v[0]), y_polarity = this._GetPolarity(v[1]);
        if(
            (x_polarity * p2[0] <= x_polarity * p1[0]) &&
            (y_polarity * p2[1] <= y_polarity * p1[1])
        ) {
            this.grid.Remove(this);
        }
    }

    /**
     * gets whether 1 is positive or negative
     * in short it would be: n / abs(n)
     * @returns -1 when negative and 1 when positive
     */
    _GetPolarity(n) {
        n *= 10;
        return (n>>31) - (-n>>31)
    }

    OnRemove() {
        this._Recurse();
    }

    // split in to 8 smaller projectiles
    _Recurse() {
        const d = Math.SQRT1_2;
        const velocities = [
            [1, 0],
            [d, d],
            [0, 1],
            [-d, d],
            [-1, 0],
            [-d, -d],
            [0, -1],
            [d, -d]
        ];

        const origin = this.GetCenter();
        const stats = getOrbStats(this.mpl - 2);

        if(this.mpl < 3) return;

        const angle = 22.5 - Vector.getAngle(this.velocity);
        for(let i = 0; i < velocities.length; i++) {
            const v = Vector.rotate(velocities[i], angle);
            this.grid.InsertClient(new MagicProjectile(origin, stats.size, v, speed.projectile, {
                dmg: stats.dmg,
                owner: this.owner,
                mpl: this.mpl - 2
            }));
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
        this.speed = speed.projectile;
        // 1  : right
        // -1 : left
        // this.collision.type= 'none';

        this.group = GROUPS.PROJECTILE;
        this.expand = 1;
    }

    Step(t) {
        const ts = t * 0.001;

        if(this.projectile) {
            this.position[0] += this.velocity[0] * this.speed * ts;
            this.position[1] += this.velocity[1] * this.speed * ts;
            return;
        }
        const owner = this.grid.GetClientById(this.owner);
        if(!owner) this.grid.Remove(this);
        
        // let [cx, cy] = owner.GetCenter();
        this.direction = owner.facing == 'right' ? 1 : -1;

        // basically ensure the distance between their centeres is d 
        const widthDiff = .5 * (owner.dimensions[0] - this.dimensions[0]);
        const d = .5 * (1.2 * this.dimensions[0] + owner.dimensions[0]);
        const cx = owner.position[0] + widthDiff + this.direction * d;


        // let cx = owner.position[0] + this.direction * .5 * ( this.dimensions[0] + owner.dimensions[0] );
        const cy = owner.position[1] + .5 * owner.dimensions[1] - this.dimensions[1] * .5;
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
        
        if(!owner) return; // check if the shield is removed due to the owner dying
        
        owner.shield = null;
    }

    Collision(ev) {
        const owner = this.grid.GetClientById(this.owner);
        for(let i = 0; i < ev.objects.length; i++) {
            const o = ev.objects[i];
            if(o instanceof MagicProjectile) return;
            if(o instanceof RectSolid) {
                this._Explode();
                return;
            }

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

        this._Explode();
    }

    _Explode() {
        const s = Math.max(this.dimensions[0], this.dimensions[1]);
        this.grid.InsertClient(new ExplosionParticle(this.GetCenter(), [s, 2.5 * s], 10));

        this.grid.Remove(this);
    }

    toJSON() {
        return false;
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

        const opacity = math.lerp(this.frame / this.duration, 0.8, 0.4);
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fill();

        this.frame++;   
    }

    // toJSON() {
    //     return {
    //         constructor: this.constructor.name,
            
    //         position: this.position,
    //         dimensions: this.dimensions,
    //         frame: this.frame,
    //         diameters: this.diameters,
    //         duration: this.duration
    //     }
    // }

    toJSON() {
        return false;
    }
}

let itemTextures = {};

export class Item extends Client {
    constructor(position, item) {
        super(position, [.25, .25]);
        this.item = item;
    }

    Render(ctx, scale, offset) {

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

export {SlopeSolid, RectSolid} from './solid.js'