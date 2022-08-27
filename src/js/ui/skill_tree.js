import {newSVG} from '../svg.js'


const SKILL_TREE = [
    'arcane',
    ['arcane', 'double_shot', 'triple_shot', 'quad_shot', 'penta_shot'],
    ['laser', 'curved_laser'],
    ['shield', 'shield_shot', 'expand_shield'],
    ['basic_dash', 'intermediate_dash', 'advanced_dash']
]

function createStatMenu() {
    const main = document.createElement('div');
    main.classList.add('skill-tree');

    const canvas = document.createElement('canvas');
    canvas.classList.add('st-canvas');
    main.appendChild(canvas);

    const skills = document.createElement('div');
    createSkillTree(skills, canvas, {w: 5, h: 5});
    main.appendChild(skills);

    const container = document.getElementById('menu');
    container.innerHTML = '';
    container.appendChild(main);
}

/**
 * Create list of skill icons 
 * @param {Number} w width of the rending context
 * @param {Number} h height of the rendering context
 * @returns {Object} object of skill icons in a JSON format with the keys being the id of the skill
 */
function createTreeStruct(tree, w, spacing = 3) {
    let res = {};

    let parent = null;
    for(let i = 0, l = SKILL_TREE.length; i < l; i++) {
        const e = SKILL_TREE[i];
        if(e instanceof String) {
            // The prev string element is the parent
            res[e] = {
                require: parent ? [parent] : [],
                x: w / (l + 1) * (i + 1), 
                y: spacing
            };

            parent = e;
        } else if(e instanceof Array) {
            res = Object.assign(res, subParseTreeStrcut(parent, e, w / (l + 1) * (i + 1), spacing));
        }
    }

    return res;
}

/**
 * 
 * @param {Object} res 
 * @param {Array} tree for now tree only supports string arrays
 * @param {Number} index index at which this function is ran
 */
function subParseTreeStrcut(parent, tree, x, spacing) {
    let res = {};

    for(let i = 0; i < tree.length; i++) {
        const e = tree[i];

        if(typeof e === 'string') {
            res[e] = {
                require: parent ? [parent] : [],
                x: x,
                y: i * spacing
            };

            parent = e;
            
            continue;
        }

        // Assume e is an object
        // e.id {String} - id of the skill
        // e.require {Array} - a list of skills required for this skill to be unlocked 
        res[e.id] = {
            require: [parent].concat(e.require),
            x: x,
            y: i * spacing
        };

        parent = e.id;
    }

    return res;
}

/**
 * 
 * @param {HTMLElement} cont skill tree container 
 * @param {HTMLCanvasElement} canvas canvas to render skill tree
 * @param {Object} skills skills to render
 */
function createSkillTree(cont, canvas, options) {
    const ctx = canvas.getContext('2d');
    const width = window.innerWidth;

    const {w, h} = options;

    canvas.width = width;
    canvas.height = window.innerHeight;
    const tree = createTreeStruct(SKILL_TREE);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0, k = Object.keys(tree); i < k.length; i++) {
        const e = tree[k[i]], id = k[i];
        
        // create svg 
        const svg = newSVG(`./src/svg/attack/${e.id}.svg`);
        svg.classList.add('st-skill');
        svg.style.left = `${e.x - .5 * w}px`;
        svg.style.top = `${e.y - .5 * h}px`;
        cont.appendChild(svg);

        // Render lines connecting to other skills 
        if(e.require == undefined || e.require.length == 0) continue;

        for(let j = 0; j < e.require.length; j++) {
            console.log(e.require)
            const sk = tree[e.require[j]];
            let path = new Path2D();
                path.moveTo(sk.x, sk.y + .5 * h);
                const midY = ((sk.y + .5 * h) - (e.y - .5 * h))/2;
                path.lineTo(sk.x, midY);
                path.lineTo(e.x, midY);
                path.lineTo(e.x, e.y - .5 * h);
            ctx.stroke(path);
        }
    }
}


export const stat_menu = {
    show: () => {
        
    },
    hide: () => {

    },
    init: () => {
        document.getElementById('stat-menu-btn').addEventListener('click', createStatMenu)
    }
}