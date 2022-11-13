import {SpatialHash} from './spacial_hash.js';
import {PlayerClient, Enemy, MagicProjectile, Spawner, RectSolid} from './objects.js';
import {collision} from './module/collision.js'
import {initUI, keyRegistry, loadSkillBar} from './ui.js'
import * as skills from './skill.js'
import { loadFromStorage } from './save.js';
import { FPS } from './libs/fps.min.js'
import { Vector } from './module/vector.js';
import { speed } from './module/calc.js';
const grid = new SpatialHash([-30, -30], [60, 60]);

const player = grid.InsertClient(new PlayerClient([0, 0], [.5, .5], {
    health: document.getElementById('health-bar'),
    mana: document.getElementById('mana-bar'),
    xp: document.getElementById('xp-bar'),
    magicAffinity: document.getElementById('magic-affinity-bar'),
    level: document.getElementById('level')
}));
player.speed = speed.move;
loadFromStorage(player);

grid.InsertClient(new Spawner([0, 0], [12, 12], () => new Enemy(null, [.5, .5]), 3).SetZIndex(-1)).Spawn();

grid.InsertClient(new RectSolid([-5, 3], [10, 1]));
grid.InsertClient(new RectSolid([-6, 0], [1, 3]));
grid.InsertClient(new RectSolid([5, 0], [1, 5]));
// grid.InsertClient(new MagicProjectile([3, 3], .5, [0, 0], 0, 0, 'black'))

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
    right: false,
    state: {},
    timeouts: {}
};

const canvas = document.getElementById('canvas');

const toCamelCase = s => s.toLowerCase().replace(/[-_][a-z]/g, (group) => group.slice(-1).toUpperCase());

document.addEventListener('keydown', function keydown(ev) {
    if(document.activeElement != document.body) return;
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

    const skill = skills.skills[keyRegistry[ev.key]];
    if(skill == undefined) return;

    if(player.mana < skill.mana) return;
    player.mana -= skill.mana;

    let [x, y] = Vector.normalise([
        mousePos[0] - (player.position[0] * scale + offset[0]),
        mousePos[1] - (player.position[1] * scale + offset[1])
    ]);

    const clickedGridTile = [(mousePos[0] - offset[0])/scale, (mousePos[1] - offset[1])/scale];

    let functionName = toCamelCase(keyRegistry[ev.key]);
    
    skill_selector: {
        if(ev.key == keyRegistry.shield_shot && !player.shield) {
            player.mana += skill.mana;
            break skill_selector;
        }

        let result = false;
        if(skills.keydown[functionName]) result = skills.keydown[functionName]({
            grid: grid,
            caster: player,
            vector: [x, y],
            tile: clickedGridTile, 
            ctx: ctx,
            scale: scale,
            offset: offset
        });

        // if cast was unsuccessful
        if(result === false) {
            player.mana += skill.mana;
            break skill_selector;
        }
        
        player.magicAffinity += skill.mana;

    };


    // Modify keyState 
    keyState.state[ev.key] = true;

    if(skills.tick[functionName]) {
        document.querySelector(`[data-id="${skill.id}"]`).classList.add('casting')
        return;
    }

    // cooldown animation
    const el = document.querySelector(`[data-id="${skill.id}"]`);
    setTimeout(() => el.classList.add('cooldown'), 1);

    // Replace old timeout to fire 
    if(keyState.timeouts[ev.key] != undefined) clearTimeout(keyState.timeouts[ev.key]);
    keyState.timeouts[ev.key] = setTimeout(() => {
        el.classList.remove('cooldown');
        if(keyState.state[ev.key]) keydown({key: ev.key}); 
        delete keyState.timeouts[ev.key];
    }, skill.cd * 1000);
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

    if(keyState.state[ev.key]) delete keyState.state[ev.key];


    
    if(keyRegistry[ev.key]) {
        const skillName = toCamelCase(keyRegistry[ev.key]);
        if(!skills.tick[skillName]) return;
        document.querySelector(`[data-id="${keyRegistry[ev.key]}"]`).classList.remove('casting')
        return;
    }
});

!function() {
    let ticking = false;
    window.addEventListener('resize', () => {
        if (ticking) return;
        ticking = true;

        width = window.innerWidth;
        height =  window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // Max of 10 updates per second to prevent whitescreen while resizing
        setTimeout(() => {
            ticking = false;
        }, 100);
    });
}();

document.addEventListener('mousemove', ev => {
    mousePos = [ev.clientX, ev.clientY];
});

let [width, height] = [window.innerWidth, window.innerHeight]
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');
const scale = 50; // canvas pixels per grid tile
const despawnRange = 20;
let start;
let mousePos = [];
const offset = [width/2, height/2];
let focusedClient;
let gravityObjects = new Set([PlayerClient, Enemy]);

canvas.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    const pos = [(ev.clientX - offset[0])/scale, (ev.clientY - offset[1])/scale];
    const clicked = grid.ClientSelector({
        origin: pos, 
        bounds: [1, 1],
        sort: 'nearest'
    })[0];

    if(clicked && clicked.Interaction) {
        clicked.Interaction({
            client: [ev.clientX, ev.clientY],
            tile: pos,
            onClose: () => focusedClient = null
        });

        focusedClient = clicked;
    }
});

canvas.addEventListener('click', ev => {
    ev.preventDefault();

    // Convert screen click coords to grid coordinates
    // tile at top left of the screen

    const pos = [(ev.clientX - offset[0])/scale, (ev.clientY - offset[1])/scale];

    const keys = Object.keys(keyState.state);
    if(keys.length > 0) {
        const vector = Vector.normalise([
            ev.clientX - (player.position[0] * scale + offset[0]),
            ev.clientY - (player.position[1] * scale + offset[1])
        ]);

        for(let i = 0; i < keys.length; i++) {
            const skillName = toCamelCase(keyRegistry[keys[i]]);
            if(skills.click[skillName]) skills.click[skillName]({
                grid, ctx, scale, offset, vector,
                caster: player,
                tile: pos
            });
        }

        return;
    }
});

document.addEventListener("wheel", ev => {
    let ticking;
    // tile at top left of the screen
    // const pos = [(ev.clientX - offset[0])/scale, (ev.clientY - offset[1])/scale];
    if (!ticking) {
        window.requestAnimationFrame(() => {
            
            const keys = Object.keys(keyState.state);
            if(keys.length > 0) {
                const vector = Vector.normalise([
                    ev.clientX - (player.position[0] * scale + offset[0]),
                    ev.clientY - (player.position[1] * scale + offset[1])
                ]);
            
                for(let i = 0; i < keys.length; i++) {
                    const skillName = toCamelCase(keyRegistry[keys[i]]);
                    if(skills.scroll[skillName]) skills.scroll[skillName]({
                        grid, ctx, scale, offset, vector,
                        caster: player,
                        scrollDelta: ev.deltaY
                    });
                }
            
                return;
            }

            ticking = false;
        });

        ticking = true;
    }
});

const fps = new FPS({side: 'top-right'});


!function frame(t) {
    let elapsedTime = 0;
    if(!start) {
        start = t;
    } else {
        elapsedTime = t - start;
        start = t;
    }

    if(elapsedTime > 100) {
        console.warn(`elapsed time is ${elapsedTime}`);
        elapsedTime = 1000/60;
    }

    let center = player.GetCenter();

    // player movement 
    if(!player.HasTag('NoMovement')) player.Move(keyState, elapsedTime);
    grid.UpdateClient(player);

    // next use vector math to project the next place
    // the player will be and make the camera slightly behind the 
    // player by lerping time based on duration move keys are held down

    ctx.clearRect(0, 0, width, height);
    grid.Step(elapsedTime);

    let objects = grid.FindNear(center, [Math.ceil(1.5 * width / scale), Math.ceil(1.5 * height / scale)]);
    objects.sort((a, b) => a.zIndex - b.zIndex);

    if(focusedClient && focusedClient.OnFocusBeforeRender) {
        focusedClient.OnFocusBeforeRender(ctx, offset, scale)
    }

    // gravity 
    const ts = elapsedTime / 1000;
    for(let i = 0; i < objects.length; i++) {
        if(!objects[i].HasTag('NoGravity') && gravityObjects.has(objects[i].constructor)) {
            objects[i].gravity = objects[i].gravity ? objects[i].gravity + Math.min(4**(1+objects[i].gravity), 10) * ts : 6 * ts;
            objects[i].position[1] += objects[i].gravity * ts;
        }
    }

    if(player.position[1] > 200) {
        alert('fell out of world');
        player.position = [0,0]
        player.gravity = 0;
    }

    // execute tick functions if skill key is being held down 
    const keys = Object.keys(keyState.state);
    if(keys.length > 0) {
        const tilePos = [(mousePos[0] - offset[0])/scale, (mousePos[1] - offset[1])/scale];
        for(let i = 0; i < keys.length; i++) {
            const skillName = toCamelCase(keyRegistry[keys[i]]);

            if(skills.tick[skillName]) skills.tick[skillName]({
                ctx,
                offset,
                scale,
                tile: tilePos,
                caster: player
            });
        }
    }

    // collision and despawning 
    for(let i = 0, k = Object.keys(grid._step); i < k.length; i++) {
        const o = grid._step[k[i]];
        if(o == undefined) continue;
        if(!o.collision || (o.collision.type != 'active')) continue;

        if((o instanceof MagicProjectile) && ( Math.abs(player.position[0] - o.position[0]) >= despawnRange || 
        Math.abs(player.position[1] - o.position[1]) >= despawnRange ) ) {
            grid.Remove(o);
        }

        if(o.collision.type == 'active') {
            const nearBy = grid.FindNear(o.GetCenter(), o.dimensions);

            let collisions = [];
            let limit = o.collision.limit || Infinity; 

            // limit is the number of collisions to detect for an object
            for(let i = 0; i < nearBy.length; i++) {
                const e = nearBy[i];
                if(e == o) continue;
                if(e.collision.type == 'none') continue;

                const operation = `${o.collision.shape}+${e.collision.shape}`;
                let isCollided = false;
                const r1 = o.dimensions[0]/2;
                const r2 = e.dimensions[0]/2;
                switch(operation) {
                    case 'circle+circle':
                        isCollided = collision.Circles(o.position[0] + r1, o.position[1] + r1, o.dimensions[0]/2, e.position[0] + r2, e.position[1] + r2, e.dimensions[0]/2);
                        break;
                    case 'rectangle+circle':
                        isCollided = collision.RectAndCircle(o.position[0], o.position[1], o.dimensions[0], o.dimensions[1], e.position[0] + r2, e.position[1] + r2, r2);
                        break;
                    case 'circle+rectangle':
                        isCollided = collision.RectAndCircle(e.position[0], e.position[1], e.dimensions[0], e.dimensions[1], o.position[0] + r1, o.position[1] + r1, r1);
                        break;
                    case 'rectangle+rectangle':
                        isCollided = collision.Rects(o.position[0], o.position[1], o.dimensions[0], o.dimensions[1], e.position[0], e.position[1], e.dimensions[0], e.dimensions[1]);
                        break;
                    default: throw new Error(`invalid collision type ${operation}`)
                }

                if(isCollided) collisions.push(e);
                if(collisions.length >= limit) break;
            }

            if(collisions.length > 0) o.Collision({
                objects: collisions,
                grid: grid,
                ctx: ctx
            });
        }
    }

    // camera movement
    center = player.GetCenter();
    offset[0] = width/2 - center[0] * scale;
    offset[1] = height/2 - center[1] * scale;

    // Render the objects 
    for(let i = 0; i < objects.length; i++) {
        const o = objects[i];
        o.Render(ctx, offset, scale);
    }

    fps.frame()
    window.requestAnimationFrame(frame);
}();

initUI(player);
// updateStats(player);

loadSkillBar();

// Load dev tools 
!function() {
    const url = new URL(location.href);
    if(url.searchParams.get('dev') == 'true') {
        window.player = player;
        window.grid = grid;
        import('./libs/dev_tools.js').then(o => window.dev = o.dev);
    }
}();