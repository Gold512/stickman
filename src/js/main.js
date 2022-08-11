import {SpatialHash} from './spacial_hash.js';
import {PlayerClient, Enemy, MagicProjectile, Spawner} from './objects.js';
import {collision} from './collision.js'
import {initUI, updateStats} from './ui.js'
import {doubleShot, tripleShot, waveShot, shield} from './skill.js'
import { loadFromStorage } from './save.js';

const grid = new SpatialHash([-30, -30], [60, 60]);

const player = grid.InsertClient(new PlayerClient([0, 0], [.5, .5], {
    health: document.getElementById('health-bar'),
    mana: document.getElementById('mana-bar'),
    xp: document.getElementById('xp-bar'),
    level: document.getElementById('level')
}));
loadFromStorage(player);

grid.InsertClient(new Spawner([0, 0], [12, 12], () => new Enemy([3, 3], [.5, .5]), 3)).Spawn();


// grid.InsertClient(new Enemy([3, 3], [.5, .5]));
// grid.InsertClient(new Enemy([3, 3], [.5, .5]));
// grid.InsertClient(new Enemy([3, 3], [.5, .5]));

window.spawn = function(n) { 
    for(let i = 0; i < n; i++) {
        grid.InsertClient(new Enemy([3, 3], [.5, .5]));
    }
}

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
        return;

        case 'a':
        case 'ArrowLeft':
            keyState.left = true;
        return;

        case 's':
        case 'ArrowDown':
            keyState.down = true;
        return;

        case 'd':
        case 'ArrowRight':
            keyState.right = true;
        return;

        // Attack keys
    }

    if(ev.repeat) return;

    let [x, y] = mousePos;

    x -= player.position[0] * scale + width/2;
    y -= player.position[1] * scale + height/2;
    
    // Make magnitude always 1 
    const magnitude = Math.sqrt(x * x + y * y);
    x /= magnitude;
    y /= magnitude;

    switch(ev.key) {
        case 'e':
            doubleShot(grid, player, [x, y])
        break;

        case 'f':
            tripleShot(grid, player, [x, y]);
        break;

        case 'k':
            waveShot(grid, player, [x, y]);
        break;

        case 'q':
            shield(grid, player, [x, y]);
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
    if(player.mana <= 3) return;

    let [x, y] = [ev.clientX, ev.clientY];

    x -= player.position[0] * scale + width/2;
    y -= player.position[1] * scale + height/2;

    // Make magnitude always 1 
    const magnitude = Math.sqrt(x * x + y * y);
    x /= magnitude;
    y /= magnitude;

    const projectile = grid.InsertClient(new MagicProjectile([x + player.position[0] + .5 * player.dimensions[0], y + player.position[1] + .5 * player.dimensions[1]], .5, [x, y], .3, 1, 'black'));
    projectile.owner = player.id;

    player.mana -= 3;

    document.querySelector('.skill').classList.add('cooldown');
    setTimeout(() => document.querySelector('.skill').classList.remove('cooldown'), 500)
});

document.addEventListener('mousemove', ev => {
    mousePos = [ev.clientX, ev.clientY];
});

const canvas = document.getElementById('canvas');
const [width, height] = [window.innerWidth, window.innerHeight]
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');
const scale = 50; // canvas pixels per grid tile
const despawnRange = 20;
let start;
let mousePos = [];

!function frame(t) {
    let elapsedTime = 0;
    if(!start) {
        start = t;
    } else {
        elapsedTime = t - start;
        start = t;
    }

    // player movement 
    player.Move(keyState, .15);
    grid.UpdateClient(player);
    const offset = [width/2, height/2];

    grid.Step(elapsedTime);
    
    ctx.clearRect(0, 0, width, height);

    let objects = grid.FindNear(player.position, [Math.ceil(1.5 * width / scale), Math.ceil(1.5 * height / scale)]);

    // Render the objects 
    for(let i = 0; i < objects.length; i++) {
        const o = objects[i];
        o.Render(ctx, offset, scale);
    }

    // Object despawning
    for(let i = 0, k = Object.keys(grid._step); i < k.length; i++) {
        const o = grid._step[k[i]];
        if(o == undefined) continue;

        if(Math.abs(player.position[0] - o.position[0]) >= despawnRange || 
        Math.abs(player.position[1] - o.position[1]) >= despawnRange) {
            grid.Remove(o);
        }

        if(o.collision.type == 'active') {
            const nearBy = grid.FindNear(o.position, [1, 1]);
            let collisions = [];
            for(let i = 0; i < nearBy.length; i++) {
                const e = nearBy[i];
                if(e == o) continue;
                if(e.collision.type == 'none') continue;

                const operation = `${o.collision.shape}+${e.collision.shape}`;
                let isCollided = false;
                switch(operation) {
                    case 'circle+circle':
                        isCollided = collision.Circles(o.position[0], o.position[1], o.dimensions[0]/2, e.position[0], e.position[1], e.dimensions[0]/2);
                        break;
                    case 'rectangle+circle':
                        isCollided = collision.RectAndCircle(o.position[0], o.position[1], o.dimensions[0], o.dimensions[1], e.position[0], e.position[1], e.dimensions[0]/2);
                        break;
                    case 'circle+rectangle':
                        isCollided = collision.RectAndCircle(e.position[0], e.position[1], e.dimensions[0], e.dimensions[1], o.position[0], o.position[1], o.dimensions[0]/2);
                        break;
                    case 'rectangle+rectangle':
                        isCollided = collision.Rects(o.position[0], o.position[1], o.dimensions[0], o.dimensions[1], e.position[0], e.position[1], e.dimensions[0], e.dimensions[1]);
                        break;
                    default: throw new Error(`invalid collision type ${operation}`)
                }

                if(isCollided) collisions.push(e);
            }

            if(collisions.length > 0) o.Collision({
                objects: collisions,
                grid: grid,
                ctx: ctx
            });
        }
    }

    window.requestAnimationFrame(frame);
}();

initUI(player);
updateStats(player);