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
    }

    /**
     * Change speed of projectile 
     * @param {Number[]} vel the x and y velocity of the projectile 
     */
    SetSpeed(vel) {
        this.velocity = vel;
    }

    Step() {
        this.position[0] += this.velocity[0] * this.speed;
        this.position[1] += this.velocity[1] * this.speed;
    }
}