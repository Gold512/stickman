import {math} from './math.js';
import {Client} from './spacial_hash.js';

const diagonalScaling = Math.pow(Math.sqrt(2), -1);

export class PlayerClient extends Client {
    constructor(position, dimensions) {
        super(position, dimensions);
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
}

export class Enemy extends Client {
    constructor(position, dimensions) {
        super(position, dimensions);
        this.action = {};
    }

    Step(t) {
        if(!this.action.time || this.action.time <= 0) {
            this.action.direction = math.rand_int(1, 8);
            this.action.time = math.rand_int(150, 500);
        }

        this.action.time -= t;
    }

    Render(ctx, offset, scale) {
        const pos = offset;
        // Render player 
        ctx.fillStyle = 'rgba(200, 0, 0, 1)';

        ctx.fillRect(this.position[0] * scale + pos[0], this.position[1] * scale + pos[1], this.dimensions[0] * scale, this.dimensions[0] * scale);
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
        const size = o.dimensions[0];
        const vel = o.velocity;

        ctx.beginPath();
        ctx.arc(o.position[0] * scale + pos[0], o.position[1] * scale + pos[1], size * scale , 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for(let j = 0; j < 7; j++) {
            ctx.beginPath();
            ctx.arc(o.position[0] * scale + pos[0] - vel[0] * j *scale * .2, o.position[1] * scale + pos[1] - vel[1] *  j *scale* .2, size * scale , 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    Collision(ev) {
        ev.grid.Remove(this);
    }
}