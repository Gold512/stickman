// Create a AI to allow an entity to react to its surroundings
class AI { 
    constructor(client, {
        wander = true,
        stayWithin = [],
        dodge = 'normal'
    }) {
        
    }

    actions = {
        /*================+
        | Movement engine |
        +=================+
        Event Priority - Projectile Dodge > Return to bounds > Wandering
        */

        // wandering 
        wander() {
            if(this.velocity[0] == 0 && this.velocity[1] == 0 && this.action.time <= 0) {
                const ang = math.rand_int(0, 360);
                this.velocity = Vector.create(1, ang);
                this.action.time = math.rand_int(200, 500);
                return true;
            } else {
                return false;
            }
        },

        stayWithin() {
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
        },

        dodge1() {
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
        }
    }
}