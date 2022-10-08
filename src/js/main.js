import {SpatialHash} from './spacial_hash.js';
import {PlayerClient, Enemy, MagicProjectile, Spawner} from './objects.js';
import {collision} from './collision.js'
import {initUI, keyRegistry, loadSkillBar} from './ui.js'
import * as skills from './skill.js'
import { loadFromStorage } from './save.js';
import { FPS } from './libs/fps.min.js'
import { ElementCreator } from './libs/element_creator.js'
import { Vector } from './vector.js';
import { math } from './math.js';
const grid = new SpatialHash([-30, -30], [60, 60]);

const player = grid.InsertClient(new PlayerClient([0, 0], [.5, .5], {
    health: document.getElementById('health-bar'),
    mana: document.getElementById('mana-bar'),
    xp: document.getElementById('xp-bar'),
    magic_affinity: document.getElementById('magic-affinity-bar'),
    level: document.getElementById('level')
}));
loadFromStorage(player);

grid.InsertClient(new Spawner([0, 0], [12, 12], () => new Enemy(null, [.5, .5]), 3).SetZIndex(-1)).Spawn();

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

    let [x, y] = mousePos;

    x -= player.position[0] * scale + width/2;
    y -= player.position[1] * scale + height/2;
    
    // Make magnitude always 1 
    const magnitude = Math.sqrt(x * x + y * y);
    x /= magnitude;
    y /= magnitude;

    const offset = [width/2, height/2];

    const clickedGridTile = [(mousePos[0] - offset[0])/scale, (mousePos[1] - offset[1])/scale];

    skill_selector: {
        if(ev.key == keyRegistry.shield_shot && !player.shield) {
            player.mana += skill.mana;
            break skill_selector;
        }

        let functionName = toCamelCase(keyRegistry[ev.key]);
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

canvas.addEventListener('click', ev => {
    ev.preventDefault();

    // Convert screen click coords to grid coordinates
    const offset = [width/2, height/2];
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

    const clicked = grid.ClientSelector({
        origin: pos, 
        bounds: [1, 1],
        sort: 'nearest'
    })[0];

    if(clicked && clicked.Interaction) {
        clicked.Interaction({
            client: [ev.clientX, ev.clientY],
            tile: pos
        });
    }
});

document.addEventListener("wheel", ev => {
    let ticking;
    const offset = [width/2, height/2];
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

    // player movement 
    player.Move(keyState, .15);
    grid.UpdateClient(player);
    const offset = [width/2, height/2];

    ctx.clearRect(0, 0, width, height);
    grid.Step(elapsedTime);

    let objects = grid.FindNear([0, 0], [Math.ceil(1.5 * width / scale), Math.ceil(1.5 * height / scale)]);
    objects.sort((a, b) => a.zIndex - b.zIndex);

    // Render the objects 
    for(let i = 0; i < objects.length; i++) {
        const o = objects[i];
        o.Render(ctx, offset, scale);
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
                        isCollided = collision.RectAndCircle(o.position[0], o.position[1], o.dimensions[0], o.dimensions[1], e.position[0] + r2, e.position[1] + r2, e.dimensions[0]/2);
                        break;
                    case 'circle+rectangle':
                        isCollided = collision.RectAndCircle(e.position[0], e.position[1], e.dimensions[0], e.dimensions[1], o.position[0] + r1, o.position[1] + r1, o.dimensions[0]/2);
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