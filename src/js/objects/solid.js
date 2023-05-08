import { Client } from "../spacial_hash.js";
import { GROUPS } from "./objects.js";

export class RectSolid extends Client {
    /**
     * 
     * @param {import("../module/vector.js").Vector2D} position 
     * @param {import("../module/vector.js").Vector2D} dimensions 
     */
    constructor(position, dimensions) {
        super(position, dimensions);
        this.collision = {
            type: 'active', 
            shape: 'rectangle',
            solid: true
        }
        this.groups = GROUPS.SOLID;
    }

    Step() {}

    Collision(ev) {
        const center = this.GetCenter();

        for(let i = 0; i < ev.objects.length; i++) {
            const o = ev.objects[i];
            if(!o.collision.solid) continue;
            if(o.group === GROUPS.PROJECTILE) continue;

            // move object that collided away so it will no longer
            // overlap the solid 
            // collision conditions based on edge distance comparisons
            // basically the side that is collided with is the side which the opposite edges of the 
            // objects are the closest to each other
            // also make object lose its velocity on collision

            const obj_c = o.GetCenter();
            
            // distances between object edges

            // distance between left edge of o and right edge of this
            const LR_diff = Math.abs(o.position[0] - (this.position[0] + this.dimensions[0]));
            
            // distance between top edge of o and bottom edge of this
            const TB_diff = Math.abs(o.position[1] - (this.position[1] + this.dimensions[1]));

            const RL_diff = Math.abs((o.position[0] + o.dimensions[0]) - this.position[0]);

            const BT_diff = Math.abs((o.position[1] + o.dimensions[1]) - this.position[1]);

            const min_y_diff = Math.min(TB_diff, BT_diff);
            const min_x_diff = Math.min(RL_diff, LR_diff);

            // check if the object collided from the right
            if( (obj_c[0] > center[0]) && (LR_diff < min_y_diff)) {
                o.position[0] = this.position[0] + this.dimensions[0];
                continue;
            } 
            
            // check if the object collided from the left
            if( (obj_c[0] < center[0]) && (RL_diff < min_y_diff) ) {
                o.position[0] = this.position[0] - o.dimensions[0];
                continue;
            }
            

            // check if collided from top
            if( (obj_c[1] < center[1]) && (BT_diff < min_x_diff) ) {
                o.position[1] = this.position[1] - o.dimensions[1];
                if(o._gravity !== undefined) o._gravity = 0;
                if(o.onGround === false) o.onGround = true;
                continue;
            }

            // check if collided from bottom
            if( (obj_c[1] > center[1]) && (TB_diff < min_x_diff) ) {
                o.position[1] = this.position[1] + this.dimensions[1];
                continue;
            }
        }
    }

    Render(ctx, offset, scale) {
        ctx.fillStyle = 'gray';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;

        ctx.fillRect(this.position[0] * scale + offset[0], this.position[1] * scale + offset[1], this.dimensions[0] * scale, this.dimensions[1] * scale);
        ctx.strokeRect(this.position[0] * scale + offset[0], this.position[1] * scale + offset[1], this.dimensions[0] * scale, this.dimensions[1] * scale);

        ctx.fillStyle = null;
        ctx.strokeStyle = null;
        ctx.lineWidth = null;
    }

    toJSON() {
        return {
            position: this.position,
            dimensions: this.dimensions
        }
    }
}

const SLOPE_LEFT = 0;
const SLOPE_RIGHT = 1;

export class SlopeSolid extends Client {
    /**
     * @param {import("../module/vector.js").Vector2D} position
     * @param {import("../module/vector.js").Vector2D} dimensions
     * @param {('left'|'right')} direction 
     */
    constructor(position, dimensions, direction = 'left') {
        super(position, dimensions);

        this.collision = {
            type: 'active',
            shape: 'rectangle',
            solid: true
        }

        switch(direction) {
            case 'left':
                this.direction = SLOPE_LEFT;
                break;
            case 'right':
                this.direction = SLOPE_RIGHT;
                break;
            default: throw new Error('Invalid direction');
        }
    }

    // Restructure global tick function so this is not needed
    Step() {}

    Collision(ev) {
        const offset = this.dimensions[1] / 2;
        const MAX_Y_MOVEMENT = 0.3;

        // TODO use gravity to make 'slippery' slopes
        if(this.direction === SLOPE_RIGHT) {
            for(let i = 0; i < ev.objects.length; i++) {
                const o = ev.objects[i];
                if(!this._checkBoundingBox(this, o.left, o.left, o.bottom, o.bottom)) continue;
                
                let newY = this.top + o.left - this.left;
                let dy = newY - player.bottom;
                if((Math.abs(dy) > MAX_Y_MOVEMENT) && dy > 0) continue; // limit Y movement to prevent 'teleporting'
                
                o.bottom = newY;
                o._gravity = 0;
                o.onGround = true;
            }
        } else {
            for(let i = 0; i < ev.objects.length; i++) {
                const o = ev.objects[i];
                if(!this._checkBoundingBox(this, o.right, o.right, o.bottom, o.bottom)) continue;
                
                // limit Y movement to prevent 'teleporting'
                let newY = this.top + this.right - o.right;
                let dy = newY - player.bottom;
                if(Math.abs(dy) > MAX_Y_MOVEMENT && dy > 0) continue; 
                
                o.bottom = newY;
                o._gravity = 0;
                o.onGround = true;
            }
        }
    }

    _checkBoundingBox(client, x1, x2, y1, y2) {
        return (client.left <= x1 &&
                client.right >= x2 &&
                client.top <= y1 &&
                client.bottom >= y2)
    }
    
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {[number, number]} offset 
     * @param {number} scale 
     */
    Render(ctx, offset, scale) {
        let path = new Path2D();
        
        switch(this.direction) {
            case SLOPE_LEFT:
                path.moveTo(this.right * scale + offset[0], this.top * scale + offset[1]);
                path.lineTo(this.right * scale + offset[0], this.bottom * scale + offset[1]);
                path.lineTo(this.left * scale + offset[0], this.bottom * scale + offset[1]);
                path.lineTo(this.right * scale + offset[0], this.top * scale + offset[1]);
                break;

            case SLOPE_RIGHT:
                path.moveTo(this.left * scale + offset[0], this.top * scale + offset[1]);
                path.lineTo(this.right * scale + offset[0], this.bottom * scale + offset[1]);
                path.lineTo(this.left * scale + offset[0], this.bottom * scale + offset[1]);
                path.lineTo(this.left * scale + offset[0], this.top * scale + offset[1]);
                break;

        }

        ctx.strokeStyle = 'black';
        ctx.fillStyle = '#aaa';
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.fill(path);
        ctx.stroke(path);

        ctx.strokeStyle = null;
        ctx.lineCap = null;
        ctx.lineWidth = null;
        ctx.lineCap = null;
        ctx.fillStyle = null;
        ctx.lineJoin = null;
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