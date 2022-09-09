import { MagicProjectile, Shield } from "./objects.js";
import { Vector } from "./vector.js"
function multiShot(grid, player, vector, foward, deg) {
    const origin = player.position;
    for(let i = 0; i < deg.length; i++) {
        const vect = deg != 0 ? Vector.rotate(vector, deg[i]) : vector;

        const x = origin[0] + .5 * player.dimensions[0] + vect[0] * foward;
        const y = origin[1] + .5 * player.dimensions[1] + vect[1] * foward;
        
        const projectile = new MagicProjectile([x, y], .5, vect, .3, 1, 'black');
        projectile.owner = player.id;

        grid.InsertClient(projectile);
    }
}

export const skills = {
    single_shot: {
        name: 'Single Shot',
        id: 'single_shot',
        mana: 3,
        cd: .3,
        cost: 0
    },
    double_shot: {
        name: 'Double Shot',
        id: 'double_shot',
        mana: 6,
        cd: .3, 
        cost: 2
    },
    triple_shot: {
        name: 'Triple Shot',
        id: 'triple_shot',
        mana: 9,
        cd: .3, 
        cost: 5
    },
    curve_shot: {
        name: 'Curve Shot',
        id: 'curve_shot',
        mana: 9,
        cd: .3
    },
    basic_dash: {
        name: 'Basic Dash',
        id: 'basic_dash',
        mana: 10,
        cd: 2,
        cost: 4
    },
    shield: {
        name: 'Shield',
        desc: 'basic defensive barrier, defends against most attacks with durability scaling with MPL of caster',
        id: 'shield',
        mana: 15,
        cd: 7,
        cost: 7
    },
    shield_shot: {
        name: 'Shield Shot',
        id: 'shield_shot',
        mana: 15,
        cd: 0 , 
        cost: 15
        // Limited by shield cast time as a shield has to be created before it can be shot 
    }
}

export function singleShot(grid, player, vector, foward = 1) {
    multiShot(grid, player, vector, foward, [0]);
}

export function doubleShot(grid, player, vector, foward = 1) {
    multiShot(grid, player, vector, foward, [5, -5]);
}

export function tripleShot(grid, player, vector, foward = 1) {
    multiShot(grid, player, vector, foward, [8, 0, -8])
}

export function shield(grid, player, vector, foward) {
    if(player.shield != null || player.shield != undefined) return false;
    const [x, y] = player.position;
    player.shield = grid.InsertClient(new Shield([x, y], [.25, 1], player.id, 10));
}

export function shieldShot(grid, player, vector, foward = 1) {
    if(!player.shield) return;
    const shield = player.shield;

    const x = player.position[0];
    const sx = shield.position[0];
    
    // Prevent player from shooting shield in the opposite direction 
    // that they are facing
    if(
        (player.facing == 'left' && sx > x) || 
        (player.facing == 'right' && sx < x)
    ) return; 

    shield.velocity = vector;
    shield.projectile = true;
    shield.collision.type = 'active';
    shield.damage = 3;

    player.shield = null;
}

export function basicDash(ctx, scale, offset, player, vector) {
    if(player.modifier.name == 'basicDash' && player.modifier.duration > 20) return;

    const [x, y] = player.GetCenter();
    player.modifier = {
        name: 'basicDash',
        duration: 200,
        noMove: true,
        callback: () => {
            player.position[0] += .5 * vector[0];
            player.position[1] += .5 * vector[1];
            
            const [cx, cy] = player.GetCenter();

            ctx.beginPath();
            ctx.moveTo(cx * scale + offset[0], cy * scale + offset[1]);
            ctx.lineTo(x * scale + offset[0], y * scale + offset[1]);
            ctx.lineWidth = player.dimensions[1] * scale;

            const grd = ctx.createLinearGradient(cx * scale + offset[0], cy * scale + offset[1], x * scale + offset[0] + .5 * player.dimensions[1] * scale, y * scale + offset[1]);
            grd.addColorStop(0, 'rgba(0,0,0, .5)');
            grd.addColorStop(.9, 'rgba(0,0,0, .15)');
            grd.addColorStop(1, 'rgba(0,0,0, 0)');

            ctx.strokeStyle = grd;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }
}

const waveAngles = [];
for(let i = 0; i < 360; i++) waveAngles.push(i);

export function waveShot(grid, player, vector, foward = 1) {
    multiShot(grid, player, vector, foward, waveAngles);
}