import { MagicProjectile, Shield } from "./objects.js";
import { Vector } from "./vector.js";
import { math } from "./math.js";
function multiShot(grid, caster, vector, foward, deg) {
    const origin = caster.position;
    for(let i = 0; i < deg.length; i++) {
        const vect = deg[i] != 0 ? Vector.rotate(vector, deg[i]) : vector;

        const x = origin[0] + .5 * caster.dimensions[0] + vect[0] * foward;
        const y = origin[1] + .5 * caster.dimensions[1] + vect[1] * foward;
        
        grid.InsertClient(new MagicProjectile([x, y], .5, vect, 15, {
            dmg: 1,
            color: 'black',
            owner: caster.id
        }));
    }
}

export const skills = {
    single_shot: {
        name: 'Single Shot',
        id: 'single_shot',
        mana: 3,
        cd: .3,
        cost: 0,
        mpl: 1
    },
    double_shot: {
        name: 'Double Shot',
        id: 'double_shot',
        mana: 6,
        cd: .3, 
        cost: 2,
        mpl: 2
    },
    triple_shot: {
        name: 'Triple Shot',
        id: 'triple_shot',
        mana: 9,
        cd: .3, 
        cost: 5,
        mpl: 2
    },
    curve_shot: {
        name: 'Curve Shot',
        id: 'curve_shot',
        mana: 8,
        cd: .3,
        mpl: 3,
        cost: 3,
        desc: 'using mana to change the trojectory of the projectile, an arc path can be achieved\nClick - fire\nScroll - change arc degree',

        curve: 60
    },
    levitation: {
        name: 'Levitation',
        id: 'levitation',
        mana: 3,
        cd: 2,
        cost: 3,
        mpl: 2
    },
    flight: {
        name: 'Flight',
        id: 'levitation',
        mana: 8,
        cd: 2,
        cost: 8,
        mpl: 3
    },
    super_speed: {
        name: 'Super Speed',
        id: 'super_speed',
        mana: 20,
        cd: 2,
        cost: 20,
        mpl: 6
    },
    hyperspeed: {
        name: 'Hyperspeed',
        id: 'hyperspeed',
        mana: 150,
        cd: 1,
        cost: 50,
        mpl: 8
    },
    shield: {
        name: 'Shield',
        desc: 'basic defensive barrier, defends against most attacks with durability scaling with MPL of caster',
        id: 'shield',
        mana: 15,
        cd: 7,
        cost: 5,
        mpl: 2
    },
    shield_expand: {
        name: 'Shield Expand',
        id: 'shield_expand',
        mana: 3,
        cd: 0,
        cost: 8,
        mpl: 3
    },
    shield_shot: {
        name: 'Shield Shot',
        id: 'shield_shot',
        mana: 15,
        cd: 0 , 
        cost: 15,
        mpl: 5
        // Limited by shield cast time as a shield has to be created before it can be shot 
    },

}

export const mpl_colors = [
    'pink',
    'lime',
    'yellow',
    'red',
    'blue',
    'purple',
    'gray'
]

function curveShotArc(a, b, angle) {
    // ensure that b is to the right of a
    // if(a[0] > b[0]) [a, b] = [b, a];

    // let v1 = Vector.create(360 - angle - rotation);
    // let v2 = Vector.create(180 + angle - rotation);

    let v1 = Vector.sub(b, a);
    v1 = Vector.rotate(v1, -angle);
    let v2 = Vector.sub(a, b);
    v2 = Vector.rotate(v2, angle);

    // console.log(a, v1, b, v2)

    const intersection = Vector.intersection(a, v1, b, v2);

    const a2 = .5 * (180 - 2 * angle);
    const l = math.line_length(a, intersection);
    return {
        center: intersection,
        radius: l,
        rotationPerUnit: 1/l,
        angleA: Vector.getAngle(Vector.sub(a, intersection)),
        angleB: Vector.getAngle(Vector.sub(b, intersection)),
        vectors: [v1, v2]
    };
}

export const keydown = (function() {
    function singleShot({ grid, caster, vector, foward = 1 } = {}) {
        multiShot(grid, caster, vector, foward, [0]);
    }

    function doubleShot({ grid, caster, vector, foward = 1 } = {}) {
        multiShot(grid, caster, vector, foward, [5, -5]);
    }

    function tripleShot({ grid, caster, vector, foward = 1 } = {}) {
        multiShot(grid, caster, vector, foward, [8, 0, -8])
    }

    function shield({ grid, caster } = {}) {
        if(caster.shield != null || caster.shield != undefined) return false;
        const [x, y] = caster.position;
        caster.shield = grid.InsertClient(new Shield([x, y], [.25, 1], caster.id, 10));
    }

    function shieldShot({ caster, vector } = {}) {
        if(!caster.shield) return false;
        const shield = caster.shield;

        const x = caster.position[0];
        const sx = shield.position[0];

        // Prevent caster from shooting shield in the opposite direction 
        // that they are facing
        if(
            (caster.facing == 'left' && sx > x) || 
            (caster.facing == 'right' && sx < x)
        ) return; 

        shield.velocity = vector;
        shield.projectile = true;
        shield.collision.type = 'active';
        shield.damage = 3;

        caster.shield = null;
    }

    function superSpeed({ ctx, scale, offset, caster, vector, tile } = {}) {
        // Cast will fail if remaining duration is less then 20ms or 
        // another modifier is present
        if((caster.modifier.name == 'superSpeed' && caster.modifier.duration > 20)
        || (caster.modifier.name && caster.modifier.name != 'superSpeed')) return false;

        const speed = 5;

        // calculate amount of time required to reach clicked point
        let dist = [caster.position[0] - tile[0], caster.position[1] - tile[1]];
        let time = speed * Math.sqrt(dist[0]**2 + dist[1]**2) * 60;

        const [x, y] = caster.GetCenter();
        caster.modifier = {
            name: 'superSpeed',
            duration: time,
            noMove: true,
            callback: (_, t) => {
                const ts = t * 0.001;
                if(caster.mana < 1) {
                    caster.modifier = {};
                    return;
                }

                caster.position[0] += speed * vector[0] * ts;
                caster.position[1] += speed * vector[1] * ts;
                caster.mana -= 1;

                const [cx, cy] = caster.GetCenter();

                ctx.beginPath();
                ctx.moveTo(cx * scale + offset[0], cy * scale + offset[1]);
                ctx.lineTo(x * scale + offset[0], y * scale + offset[1]);
                ctx.lineWidth = caster.dimensions[1] * scale;

                const grd = ctx.createLinearGradient(cx * scale + offset[0], cy * scale + offset[1], x * scale + offset[0] + .5 * caster.dimensions[1] * scale, y * scale + offset[1]);
                grd.addColorStop(0, 'rgba(0,0,0, .5)');
                grd.addColorStop(.9, 'rgba(0,0,0, .15)');
                grd.addColorStop(1, 'rgba(0,0,0, 0)');

                ctx.strokeStyle = grd;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }
    }

    return {singleShot, doubleShot, tripleShot, shield, shieldShot, superSpeed}
}());

export const tick = (function() {
    function curveShot({ ctx, scale, offset, caster, tile } = {}) {
        // console.log(caster.GetCenter(), tile)
        const arc = curveShotArc(caster.GetCenter(), tile, skills.curve_shot.curve);
        // console.log(arc)
        ctx.strokeStyle = 'rgba(0,0,0, .5)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(arc.center[0] * scale + offset[0], arc.center[1] * scale + offset[1], arc.radius * scale, arc.angleA * Vector.DEG_TO_RAD_SCALE, arc.angleB * Vector.DEG_TO_RAD_SCALE);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0,255,0, 1)';
        ctx.lineWidth = 3;

        // ctx.beginPath();
        // ctx.moveTo(...p(caster.GetCenter()));
        // ctx.lineTo(...p(Vector.add(caster.GetCenter(), Vector.multiply(arc.vectors[0], 5))));
        // ctx.stroke();

        // ctx.beginPath();
        // ctx.moveTo(...p(tile));
        // ctx.lineTo(...p(Vector.add(tile, Vector.multiply(arc.vectors[1], 5))));
        // ctx.stroke();

        // ctx.strokeStyle = 'rgba(255,0,0, 1)';
        // ctx.lineWidth = 3;

        // ctx.beginPath();
        // ctx.moveTo(...p(caster.GetCenter()));
        // ctx.lineTo(...p(Vector.add(caster.GetCenter(), Vector.multiply(arc.vectors[0], -5))));
        // ctx.stroke();

        // ctx.beginPath();
        // ctx.moveTo(...p(tile));
        // ctx.lineTo(...p(Vector.add(tile, Vector.multiply(arc.vectors[1], -5))));
        // ctx.stroke();

        // ctx.strokeStyle = null;
        // ctx.lineWidth = null;
        // ctx.lineCap = null;
    }
    return {curveShot}
})();

export const click = (function() {
    function curveShot({ ctx, scale, offset, caster, tile, grid, vector } = {}) {
        if(caster.mana < skills.curve_shot.mana) return;

        caster.mana -= skills.curve_shot.mana;
        const center = caster.GetCenter();

        const arc = curveShotArc(center, tile, skills.curve_shot.curve);

        let size = .5;

        let direction = 1;

        const circumference = 2 * Math.PI * arc.radius;
        // initial angle of player relative to center of arc
        let angle = Vector.getAngle(Vector.sub(center, arc.center));
        const speed = 15;

        angle += direction * (size / circumference * 360);
        const pos = Vector.add(arc.center, Vector.create(angle, arc.radius));
        grid.InsertClient(new MagicProjectile(pos, size, vector, speed, {
            dmg: 2,
            color: 'black',
            curve: {
                center: Vector.sub(arc.center, [.5 * size, .5 * size]),
                radius: arc.radius,
                angle: angle,
                direction: direction,
                distance: Math.abs(Vector.getAngle(Vector.sub(center, arc.center)) - angle)
            }
        }));

        
    }
    
    return {curveShot}
})();

export const scroll = (function() {
    function curveShot({scrollDelta} = {}) {
        skills.curve_shot.curve -= scrollDelta/100 * 3.6;
        skills.curve_shot.curve = math.clamp(skills.curve_shot.curve, 1, 50)
    }

    return {curveShot}
})();

// export const keyup = (function() {

//     return {curveShot}
// })();

// const waveAngles = [];
// for(let i = 0; i < 360; i++) waveAngles.push(i);

// export function waveShot({ grid, caster, vector, foward = 1 } = {}) {
//     multiShot(grid, caster, vector, foward, waveAngles);
// }