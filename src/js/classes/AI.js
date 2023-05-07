import { MagicProjectile, PlayerClient } from "../objects/objects.js";
import { math } from "../module/math.js";
import { Vector } from "../module/vector.js";
import { collision } from '../module/collision.js';
import { skillCaster, skills } from "../skill.js";
import { skillConversionTable } from "../module/calc.js";

// Create a AI to allow an entity to react to its surroundings
export class AI { 
    /**
     * 
     * @param {Client} client - client that this AI is managing
     * @param {Object} config - AI configuration object
     * @param {Boolean} config.wander - Whether client should wander randomly when idle
     * @param {Boolean} config.stayWithin - top right and bottom left corner of bounds to stay within
     * @param {('none'|'low'|'medium'|'high')} config.dodge - level of projectile dodge in AI
     * @param {object} config.attack - options for enemy attack patterns
     * @param {Number} config.attack.viewDistance - distance that a target the enemy attacks will be selected
     * @param {Number} config.attack.targetDistance - maximum distance that the enemy retains the selected target
     */
    constructor(client, {
        type = 'algorithm',
        wander = true,
        stayWithin = [],
        dodge = 'none',
        attack: {
            viewDistance = 6,
            targetDistance = 8
        } = {}
    }) {
        this.client = client;

        this.actionQueue = [];
        if(wander) this.actionQueue.push('wander');
        if(stayWithin) this.actionQueue.push('stayWithin');
        if(dodge != "none") this.actionQueue.push('dodge_' + dodge);

        this.action = { time: 0 };

        // attack data 
        this.target = null;

        this.config = {
            type,
            wander,
            stayWithin,
            dodge,
            attack: {
                viewDistance,
                targetDistance
            }
        }
    }

    // AI tick function to calculate next action in current frame
    Tick(t) {
        for(let i = 0; i < this.actionQueue.length; i++) {
            const res = this[this.actionQueue[i]]();
            if(res) break;
        }

        if(this.config.attack && this.client.skills.length > 0) {
            if(this.attack_cd) {
                this.attack_cd -= t;
                if(this.attack_cd < 0) this.attack_cd = null;
            }
            
            if(!this.attack_cd) this.attack();
        }

        this.action.time -= t;
        if(this.action.time <= 0) {
            this.client.velocity = [0, 0];
            this.action.type = '';
        }
    }

    // Object property proxy so that the references can just be this 
    // get position() { return this.client.position; }
    // get dimensions() { return this.client.dimensions; }
    // get grid() { return this.client.grid; }

    // set velocity(v) {
    //     this.client.velocity = v;
    // }
    // get velocity() {
    //     return this.client.velocity;
    // }
    // get bounds() {
    //     return this.client.bounds;
    // }

    /*================+
    | Movement engine |
    +=================+
    Event Priority - Projectile Dodge > Return to bounds > Wandering
    */

    // wandering 
    wander() {
        if(this.client.velocity[0] == 0 && this.client.velocity[1] == 0 && this.action.time <= 0) {
            const ang = math.rand_int(0, 360);
            this.client.velocity = Vector.create(ang);
            this.action.time = math.rand_int(200, 500);
            return true;
        }
    }

    stayWithin() {
    // Return to bounds if idle 
        if(this.client.bounds && this.action.type != 'dodge') {
            const [topLeft, bottomRight] = this.client.bounds;

            // Distance nearer to center at which the enemy will attempt to return to bounds
            const dist = .3;
            let vel = [0, 0];

            // x direction 
            if(this.client.position[0] < topLeft[0] + dist) {
                vel[0] = 1
            } else if(this.client.position[0] > bottomRight[0] - dist) {
                vel[0] = -1;
            }

            // y direction
            if(this.client.position[1] < topLeft[1] + dist) {
                vel[1] = 1
            } else if(this.client.position[1] > bottomRight[1] - dist) {
                vel[1] = -1;
            }

            if(vel[0] != 0 && vel[1] != 0) vel = [vel * Math.SQRT1_2, vel * Math.SQRT1_2];
            if(!(vel[0] == 0 && vel[1] == 0)) this.client.velocity = vel;
        }
    }

    dodge_low() {
        // Auto dodge 
        const PROJECTION_DIST = 5;

        const objects = this.client.grid.ClientSelector({
            origin: this.client.position, 
            bounds: [6, 6], 
            type: MagicProjectile, 
            sort: 'nearest'
        });

        // this.client.grid.FindNear([this.client.position[0], this.client.position[1]], [6, 6]);
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
                [
                    e.position[0] - sideVect[0],
                    e.position[1] - sideVect[1]
                ],
                [
                    e.position[0] + sideVect[0],
                    e.position[1] + sideVect[1]
                ],
                [
                    e.position[0] + sideVect[0] + lx,
                    e.position[1] + sideVect[1] + ly
                ],
                [
                    e.position[0] - sideVect[0] + lx,
                    e.position[1] - sideVect[1] + ly
                ]
            ],
            [
                [
                    this.client.position[0], 
                    this.client.position[1]
                ],
                [
                    this.client.position[0] + this.client.dimensions[0],
                    this.client.position[1]
                ],
                [
                    this.client.position[0] + this.client.dimensions[0],
                    this.client.position[1] + this.client.dimensions[0]
                ],
                [
                this.client.position[0],
                this.client.position[1] + this.client.dimensions[0]
                ]
            ]);

            if(willCollide) {
                // Find closest edge of collision projection normal to the 
                // velocity of the projectile

                const c = this.client.GetCenter();

                const vect = Vector.normalise(sideVect);

                if(e.curve) {
                    // if projectile is curved move away from the center of the arc
                    const curve = e.curve;
                    this.client.velocity = Vector.normalise(Vector.rotate(Vector.sub(curve.center, c), 180));
                    

                    this.action.time = 500;
                    this.action.type = 'dodge'
                    continue;
                }

                // Find the shortest distance to go out of the path of the projectile
                if(
                    ((e.position[0] - sideVect[0] - c[0])**2 + (e.position[1] - sideVect[1] - c[1])**2) <=
                    ((e.position[0] + sideVect[0] - c[0])**2 + (e.position[1] + sideVect[1] - c[1])**2)
                ) {
                    this.client.velocity[0] = -vect[0];
                    this.client.velocity[1] = -vect[1];
                } else {
                    this.client.velocity[0] = vect[0];
                    this.client.velocity[1] = vect[1];
                }

                this.action.time = 500;
                this.action.type = 'dodge'
                continue;
            }
        }
    }

    attack() {
        let viewDistance = this.config.attack.viewDistance;
        let targetDistance = this.config.attack.targetDistance;

        const client = this.client;
        
        let target = client.grid.GetClientById(this.target);
        if(target) {
            if(((target.position[0] - client.position[0]) ** 2 + (target.position[1] - client.position[1]) ** 2) > targetDistance ** 2) this.target = null;
        }

        if(!this.target) {
            target = client.grid.ClientSelector({
                origin: this.client.GetCenter(),
                bounds: [viewDistance, viewDistance],
                sort: 'nearest',
                type: PlayerClient,
                limit: 1
            })[0];

            // check if target exists since selectors can return null
            if(target) {
                this.target = target.id;
            } else return;
        }

        // weigh all available skills
        let weights = [{weight: 100, item: 'nothing'}];
        for(let i = 0, skillList = client.skills; i < skillList.length; i++) {
            const skillId = skillList[i];
            const skillStats = skills[skillId];

            // check if insufficient mana
            if(this.client.mana < skillStats.mana) continue;
            const manaDiff = client.mana - skillStats.mana;
            weights.push({
                // favour using more mana
                weight: Math.round(((manaDiff + 1)*10) ** -.1)*10,
                item: skillId
            });
        }

        const selectedSkill = math.weighted_random(weights);
        if(selectedSkill == 'nothing') {
            this.attack_cd = 100;
            return;
        }
        const status = skillCaster[skillConversionTable[selectedSkill]]({
            grid: this.client.grid,
            caster: client,
            vector: Vector.normalise(Vector.sub(target.position, this.client.position)),
            tile: target.GetCenter()
        });
        if(status !== false) this.client.mana -= skills[selectedSkill].mana;
        this.attack_cd = 1000*skills[selectedSkill].cd;
    }

    _getManaPercentage() {
        return 100 * this.client.mana / this.client.maxMana;
    }
}