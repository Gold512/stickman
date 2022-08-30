import {newSVG} from '../svg.js'


const SKILL_TREE = [
    'arcane',
    ['single_shot', 'double_shot', 'triple_shot', 'quad_shot', 'penta_shot'],
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
    createSkillTree(skills, canvas, {w: 6, h: 6, spacing: 2});
    main.appendChild(skills);

    // exit button
    const exit = document.createElement('div');


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

    let totalInLayer = tree.filter(v => typeof v === 'string').length;
    console.log(totalInLayer)

    let skippedIndices = 0;

    for(let i = 0, l = tree.length; i < l; i++) {
        const e = tree[i];
        if(typeof e === 'string') {
            // The prev string element is the parent
        console.log(e)
            res[e] = {
                require: parent ? [parent] : [],
                x: w * ((i + 1) / (totalInLayer + 1)), 
                y: spacing * i + spacing
            };

            parent = e;
            skippedIndices++;
        } else if(e instanceof Array) {
            res = Object.assign(res, subParseTreeStrcut(parent, e, w * ((i - skippedIndices + 1) / (tree.length - totalInLayer + 1)), spacing));
        }
    }

    return res;
}

/**
 * Parses the vertical skill chains
 * @param {Object} parent the parent of this skill chain
 * @param {Array} tree for now tree only supports string arrays
 * @param {Number} index index at which this function is ran
 */
function subParseTreeStrcut(parent, tree, x ,spacing) {
    let res = {};

    for(let i = 0; i < tree.length; i++) {
        const e = tree[i];

        if(typeof e === 'string') {
            res[e] = {
                require: parent ? [parent] : [],
                x: x,
                y: (i + 1) * spacing + spacing
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
            y: (i + 1) * spacing + spacing
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
    const vh = window.innerHeight / 100;
    const height = window.innerHeight;

    const {w, h, spacing} = options;

    canvas.width = width;
    canvas.height = height;

    const tree = createTreeStruct(SKILL_TREE, 100, spacing);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0, k = Object.keys(tree); i < k.length; i++) {
        const e = tree[k[i]], id = k[i];
        
        // create skill container
        const skill = document.createElement('div');
        skill.classList.add('st-skill');
        const x = e.x - .5 * w;
        const y = e.y;

        skill.style.left = `${x * vh}px`;
        skill.style.bottom = `${y * vh * 5}px`;
        skill.style.width = `${w * vh}px`;
        skill.style.height = `${h * vh}px`;

        // create svg 
        const svg = newSVG(`./src/svg/attack/${id}.svg`);
            svg.classList.add('full');
            skill.appendChild(svg);

        // create hover info 
        const tooltip = document.createElement('div');
            tooltip.classList.add('tooltip');
            tooltip.innerText = 'tooltip test text';
            skill.appendChild(tooltip);

        cont.appendChild(skill);

        // Render lines connecting to other skills 
        if(e.require == undefined || e.require.length == 0) continue;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        for(let j = 0; j < e.require.length; j++) {
            console.log(e.require)
            const sk = tree[e.require[j]];

            const path = new Path2D();
                // sk.y < e.y, y1 < y2
                const x1 = vh * ( sk.x );
                const y1 = height - vh * (sk.y * 5 + h);
                const x2 = vh * ( e.x );
                const y2 = height - vh * ( e.y * 5);

                path.moveTo(x1, y1);
                const mid = (y2+y1)/2;
                path.lineTo(x1, mid);
                path.lineTo(x2, mid);
                path.lineTo(x2, y2);
                
            ctx.stroke(path);
        }

        ctx.strokeStyle = null;
        ctx.strokeWidth = null;
    }

    // Update the skill tree to fit to new size
    let ticking = false;
    window.addEventListener('resize', ev => {
        // Prevent event from firing too quickly 
        if(ticking) return;
        
        ticking = true;
        requestAnimationFrame(() => {

            ticking = false;
        });
    });
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