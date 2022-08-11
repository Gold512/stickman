import { MagicProjectile, Shield } from "./objects.js";

function calculateVector(origin, destination) {
    const [x, y] = destination;
    const [cx, cy] = origin;
    let vector = [x - cx, y - cy];
    const scaler = 1/Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    vector[0] *= scaler;
    vector[1] *= scaler;
    return vector;
}

function rotateVector(vec, ang) {
    ang = -ang * (Math.PI/180);
    let cos = Math.cos(ang);
    let sin = Math.sin(ang);
    return new Array(Math.round(10000*(vec[0] * cos - vec[1] * sin))/10000, Math.round(10000*(vec[0] * sin + vec[1] * cos))/10000);
}

function multiShot(grid, player, vector, foward, deg) {
    const origin = player.position;
    for(let i = 0; i < deg.length; i++) {
        const vect = deg != 0 ? rotateVector(vector, deg[i]) : deg;

        const x = origin[0] + .5 * player.dimensions[0] + vect[0] * foward;
        const y = origin[1] + .5 * player.dimensions[1] + vect[1] * foward;
        
        const projectile = new MagicProjectile([x, y], .5, vect, .3, 1, 'black');
        projectile.owner = player.id;

        grid.InsertClient(projectile);
    }
}

export function singleShot(grid, origin, destination, foward = 1) {
    const vector = calculateVector(origin, destination);
    grid.InsertClient(new MagicProjectile([origin[0] + vector[0] * foward, origin[0] + vector[1] * foward], .5, vector, .3, 1, 'black'));
}

export function doubleShot(grid, player, vector, foward = 1) {
    multiShot(grid, player, vector, foward, [5, -5]);
}

export function tripleShot(grid, player, vector, foward = 1) {
    multiShot(grid, player, vector, foward, [8, 0, -8])
}

export function shield(grid, player, vector, foward) {
    const [x, y] = player.position;
    grid.InsertClient(new Shield([x, y], [.25, 1], player.id, 10));
}

const waveAngles = [];
for(let i = 0; i < 360; i++) waveAngles.push(i);

export function waveShot(grid, player, vector, foward = 1) {
    multiShot(grid, player, vector, foward, waveAngles);
}