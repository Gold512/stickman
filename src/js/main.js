import {SpatialHash} from './spacial_hash.js';
import {PlayerClient, MagicProjectile} from './objects.js';
const grid = new SpatialHash([-30, -30], [60, 60]);

const player = grid.InsertClient(new PlayerClient([0, 0], [.5, .5]));
window.player = player;
window.grid = grid;

const keyState = {
    up: false,
    down: false,
    left: false,
    right: false
};

document.addEventListener('keydown', ev => {
    switch (ev.key) {
        case 'w':
        case 'ArrowUp':
            keyState.up = true;
        break;

        case 'a':
        case 'ArrowLeft':
            keyState.left = true;
        break;

        case 's':
        case 'ArrowDown':
            keyState.down = true;
        break;

        case 'd':
        case 'ArrowRight':
            keyState.right = true;
        break;
    }
});

document.addEventListener('keyup', ev => {
    switch (ev.key) {
        case 'w':
        case 'ArrowUp':
            keyState.up = false;
        break;

        case 'a':
        case 'ArrowLeft':
            keyState.left = false;
        break;

        case 's':
        case 'ArrowDown':
            keyState.down = false;
        break;

        case 'd':
        case 'ArrowRight':
            keyState.right = false;
        break;
    }
});

document.addEventListener('click', ev => {
    let [x, y] = [ev.clientX, ev.clientY];
    console.log([x, y]);

    x -= player.position[0] * scale + width/2;
    y -= player.position[1] * scale + height/2;
    console.log([x, y]);

    // Make magnitude always 1 
    const magnitude = Math.sqrt(x * x + y * y);
    x /= magnitude;
    y /= magnitude;

    console.log([x, y]);
    grid.InsertClient(new MagicProjectile([2*x + player.position[0], 2*y + player.position[1]], .5, [x, y], .3, 1, 'black'));
})

const canvas = document.getElementById('canvas');
const [width, height] = [window.innerWidth, window.innerHeight]
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');
const scale = 50; // canvas pixels per grid tile
const despawnRange = 20;
let start;

!function frame(t) {
    let elapsedTime = 0;
    if(!start) {
        start = t;
    } else {
        elapsedTime = t - start;
        start = t;
    }

    // player movement 
    player.Move(keyState, .25);
    grid.UpdateClient(player);
    const pos = [width/2, height/2];

    grid.Step(elapsedTime);
    
    ctx.clearRect(0, 0, width, height);

    let objects = grid.FindNear(player.position, [20, 20]);

    // Render the objects 
    for(let i = 0; i < objects.length; i++) {
        const o = objects[i];

        // Object despawning
        if(Math.abs(player.position[0] - o.position[0]) >= despawnRange || 
        Math.abs(player.position[1] - o.position[1]) >= despawnRange) {
            grid.Remove(o)
        }

        o.Render(ctx, pos, scale);
    }

    window.requestAnimationFrame(frame);
}();