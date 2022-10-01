import { MagicProjectile, Shield } from "./objects.js";
import { Vector } from "./vector.js"
function multiShot(grid, caster, vector, foward, deg) {
    const origin = caster.position;
    for(let i = 0; i < deg.length; i++) {
        const vect = deg[i] != 0 ? Vector.rotate(vector, deg[i]) : vector;

        const x = origin[0] + .5 * caster.dimensions[0] + vect[0] * foward;
        const y = origin[1] + .5 * caster.dimensions[1] + vect[1] * foward;
        
        const projectile = new MagicProjectile([x, y], .5, vect, .3, {dmg: 1, color: 'black'});
        projectile.owner = caster.id;

        grid.InsertClient(projectile);
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
        mana: 9,
        cd: .3,
        mpl: 3
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
    }
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

export function singleShot({ grid, caster, vector, foward = 1 } = {}) {
    multiShot(grid, caster, vector, foward, [0]);
}

export function doubleShot({ grid, caster, vector, foward = 1 } = {}) {
    multiShot(grid, caster, vector, foward, [5, -5]);
}

export function tripleShot({ grid, caster, vector, foward = 1 } = {}) {
    multiShot(grid, caster, vector, foward, [8, 0, -8])
}

export function shield({ grid, caster } = {}) {
    if(caster.shield != null || caster.shield != undefined) return false;
    const [x, y] = caster.position;
    caster.shield = grid.InsertClient(new Shield([x, y], [.25, 1], caster.id, 10));
}

export function shieldShot({ caster, vector } = {}) {
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

export function superSpeed({ ctx, scale, offset, caster, vector, tile } = {}) {
    // Cast will fail if remaining duration is less then 20ms or 
    // another modifier is present
    if((caster.modifier.name == 'superSpeed' && caster.modifier.duration > 20)
    || (caster.modifier.name && caster.modifier.name != 'superSpeed')) return false;

    const speed = .5;

    // calculate amount of time required to reach clicked point
    let dist = [caster.position[0] - tile[0], caster.position[1] - tile[1]];
    let time = speed * Math.sqrt(dist[0]**2 + dist[1]**2) * 60;

    const [x, y] = caster.GetCenter();
    caster.modifier = {
        name: 'superSpeed',
        duration: time,
        noMove: true,
        callback: () => {
            if(caster.mana < 1) {
                caster.modifier = {};
                return;
            }

            caster.position[0] += speed * vector[0];
            caster.position[1] += speed * vector[1];
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

// const waveAngles = [];
// for(let i = 0; i < 360; i++) waveAngles.push(i);

// export function waveShot({ grid, caster, vector, foward = 1 } = {}) {
//     multiShot(grid, caster, vector, foward, waveAngles);
// }