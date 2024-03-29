import {newSVG} from '../module/svg.js'
import {skills, mpl_colors} from '../skill.js'
import {ElementCreator} from '../classes/element_creator.js'
import { CreateAnimation } from '../module/animation.js'
import { saveToStorage } from '../save.js'
import { updateSkills } from './character.js'
import { math } from '../module/math.js'

const SKILL_TREE = [
    'arcane',
    ['single_shot', 'double_shot', 'triple_shot', 'quad_shot', 'penta_shot'],
    ['curve_shot', 'double_curve_shot'],
    ['laser', 'curved_laser'],
    ['shield', 'shield_shot', 'shield_expand'],
    ['levitation', 'flight', 'super_speed', 'hyperspeed'],
    ['volley_shot', 'recursive_shot']
]

const descriptions = {
    arcane: {
        name: 'Arcane',
        desc: 'Basic magic consisting of mainly channelling magic to form shapes like orbs, beams or arcs as well as propulsion',
        notUnlockable: true
    }
}

const menu_container = document.getElementById('menu')

export function createStatMenu(menu_container) {
    // menu_container.style.display = 'block';
    const main = document.createElement('div');
    main.classList.add('skill-tree');

    const canvas = document.createElement('canvas');
    canvas.classList.add('st-canvas');
    main.appendChild(canvas);

    const skills = document.createElement('div');
    skills.classList.add('skill-container');
    createSkillTree(skills, canvas, {w: 6, h: 6, spacing: 2});
    main.appendChild(skills);

    // move canvas with translate on scroll to ensure it is aligned with the
    // skill icon container
    skills.addEventListener('scroll', ev => {
        let ticking;
        if(ticking) return;

        let target = ev.currentTarget;
        window.requestAnimationFrame(() => {
            canvas.style.transform = `translate(-${target.scrollLeft}px,-${target.scrollTop}px)`;
            ticking = false;
        });

        ticking = true;
    });

    // Close btn 
    // new ElementCreator('button')
    //     .style({
    //         position: 'relative',
    //         display: 'inline-block',
    //         width: '2em',
    //         height: '2em',
    //         border: 'none',
    //         background: 'none',
    //         left: '5px',
    //         top: '5px',
    //     })
    //     .class('overlay')
    //     .addEventListener('click', ev => {
    //         main.remove();
    //         menu_container.style.display = '';
    //     })
    //     .newChild(newSVG('./src/svg/icons/close.svg'))
    //         .style({
    //             position: 'absolute',
    //             width: '75%',
    //             height: '75%',
    //             left: '50%', 
    //             top: '50%',
    //             transform: 'translate(-50%, -50%)'
    //         })
    //         .end
    //     .appendTo(main);

    // Stat point display
    new ElementCreator('div')
        .text(`You have `)
        .newChild('span').id('skill-points').style({fontWeight: 'bold'}).text(player.stats.skillPoints).end
        .text(" skill points")
        .class('text-glow')
        .style({
            position: 'absolute',
            bottom: 'calc(.6em + 8px)', 
            right: 'calc(.6em + 8px)',
            userSelect: 'none'
        })
        .appendTo(main);

    menu_container.innerHTML = '';
    menu_container.style.overflow = 'hidden';    
    menu_container.appendChild(main);
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

    let skippedIndices = 0;

    for(let i = 0, l = tree.length; i < l; i++) {
        const e = tree[i];
        if(typeof e === 'string') {
            // The prev string element is the parent
            res[e] = {
                require: parent ? [parent] : [],
                children: [],
                x: w * ((i + 1) / (totalInLayer + 1)), 
                y: spacing * i + spacing,

            };
            console.log(res)
            if(parent) res[parent].children.push(e);

            parent = e;
            skippedIndices++;
        } else if(e instanceof Array) {
            const r = subParseTreeStruct(parent, e, w * ((i - skippedIndices + 1) / (tree.length - totalInLayer + 1)), spacing);
            for(let i in r) {
                if(res[i] != undefined) {
                    res[i] = Object.assign(res[i], r[i]);
                } else res[i] = r[i];
            }
            // res = Object.assign(res, );
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
function subParseTreeStruct(parent, tree, x ,spacing) {
    let res = {};

    for(let i = 0; i < tree.length; i++) {
        const e = tree[i];

        if(typeof e === 'string') {
            res[e] = {
                require: parent ? [parent] : [],
                children: [],

                x: x,
                y: (i + 1) * spacing + spacing,
                // child: tree[i+1] || null,
                unlocked: player.skills.has(e)
            };

            if(parent) {
                if(!res[parent]) res[parent] = {children: []};
                res[parent].children.push(e);
            }

            parent = e;
            
            continue;
        }

        // Assume e is an object
        // e.id {String} - id of the skill
        // e.require {Array} - a list of skills required for this skill to be unlocked 
        res[e.id] = {
            require: [parent].concat(e.require),
            children: [],

            x: x,
            y: (i + 1) * spacing + spacing,
            // child: tree[i+1].id || null
        };

        if(parent) {
            if(!res[parent]) res[parent] = {children: []};
            res[parent].children.push(e);
        }
        
        parent = e.id;
    }

    return res;
}

/**
 * 
 * @param {HTMLElement} cont skill tree container 
 * @param {HTMLCanvasElement} canvas canvas to render skill tree
 * @param {Object} options skills to render
 * @param {Number} options.w - width of the skill icon
 * @param {Number} options.h - height of the skill icon
 * @param {Number} options.spacing - spacing of the skill icon
 */
function createSkillTree(cont, canvas, options) {
    skillTreeRender(cont, canvas, options)

    // Update the skill tree to fit to new size
    let ticking = false;
    window.addEventListener('resize', ev => {
        // Prevent event from firing too quickly 
        if(ticking) return;
        
        ticking = true;
        requestAnimationFrame(() => {
            cont.innerHTML = '';
            skillTreeRender(cont, canvas, options)
            setTimeout(() => ticking = false, 100);
        });
    });
}

function propertyMax(object, property) {
    let max = [null, -Infinity];
    for(let i in object) {
        if(object[i][property] > max[1]) max = [i, object[i][property]];
    }
    return object[max[0]];
}

/**
 * Create glow effect on canvas
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} r 
 */
function canvasGlowEffect(ctx, x, y, r) {
    let fillStyle = ctx.fillStyle;

    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255, 1)');
    grd.addColorStop(.6, 'rgba(255,255,255, .8)');
    grd.addColorStop(1, 'rgba(255,255,255, 0)');
    ctx.fillStyle = grd;
    let path = new Path2D();
    path.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill(path);

    ctx.fillStyle = fillStyle;
}

function skillTreeRender(cont, canvas, options) {
    const ctx = canvas.getContext('2d');
    const vh = window.innerHeight / 100;
    const vw = window.innerWidth / 100;
    const {w, h} = options;

    // width of the canvas will be the right edge of the rightmost icon
    
    const tree = createTreeStruct(SKILL_TREE, 100, options.spacing);

    const height = window.innerHeight;
    const width = vh * (propertyMax(tree, 'x').x + .5 * w);
    
    canvas.width = width;
    canvas.style.width = `${width}px`;
    canvas.height = height;

    // Create the icons themselves 

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const unlockedPointsToDraw = [];

    for(let i = 0, k = Object.keys(tree); i < k.length; i++) {
        const e = tree[k[i]], id = k[i];
        const sk = skills[id] || descriptions[id];
        const locked = (sk && sk.notUnlockable) ? false : !player.skills.has(id);
        const unlockable = (() => {
            if(!e.require) return true; // skill has no requirements
            for(let i = 0; i < e.require.length; i++) {
                if(tree[e.require[i]].unlocked == false) return false;
            }

            return true;
        })();
        // console.log(unlockable)

        // create skill container
        const skill = document.createElement('div');
        skill.classList.add('st-skill');
        skill.id = 'st_' + id;
        if(locked) skill.classList.add('locked')

        const x = e.x - .5 * w;
        const y = e.y;

        // skill.style.left = `${x * vh}px`;
        // skill.style.bottom = `${y * vh * 5}px`;
        // skill.style.width = `${w * vh}px`;
        // skill.style.height = `${h * vh}px`;

        skill.style.left = `${x * vh / vw}vw`;
        skill.style.bottom = `${y * 5}vh`;
        skill.style.width = `${w * vh / vw}vw`;
        skill.style.height = `${h}vh`;

        new ElementCreator('div')
            .class('skill-icon')
            .newChild(newSVG(`./src/svg/attack/${id}.svg`))
                .class('full')
                .end
            .appendTo(skill);
        

        if(sk != undefined) {

            // tooltip
            new ElementCreator('div')
                .class(['tooltip', 'skill-tooltip', 'interactive'])
                .styleVariables({color: mpl_colors[sk.mpl]})

                // tooltip_title
                .newChild('div')
                    .class('skill-title')
                    .text(`${sk.name}`)
                    .end

                // Skill discription
                .if(sk.desc, e => {
                    e.newChild('div')
                        .class('skill-desc')
                        .text(sk.desc)
                        .end
                })

                .if(!unlockable, elementCreator => {
                    // One of the required skills to unlock are not unlocked
                    skill.classList.add('not-unlockable');
                })

                // mana bar to show amount of total mana used by this skill
                .newChild('div')
                    .condition(typeof sk.mana == 'number')
                    .class(['bar', 'no-total', 'reverse'])
                    .styleVariables({
                        max: player.maxMana,
                        current: sk.mana,
                        background: 'rgb(58, 58, 255)',
                        color: 'skyblue',
                        prefix: '"Mana: "'
                    })
                    .end

                .if(locked, elementCreator => {
                    elementCreator.newChild('button')
                        .text('Unlock skill')
                        .class('skill-buy-btn')
                        .if(!unlockable, elementCreator => {
                            elementCreator.attribute('disabled');
                        })
                        .addEventListener('click', ev => {
                            if(player.stats.skillPoints < sk.cost) {
                                // shake animation on buy fail 
                                ev.currentTarget.classList.add('shake');
                                setTimeout(element => element.classList.remove('shake'), 500, ev.currentTarget);
                                return;
                            }
                            
                            ev.currentTarget.remove();
                            player.stats.skillPoints -= sk.cost;
                            document.getElementById('skill-points').innerText = player.stats.skillPoints;
                            player.skills.add(sk.id);
                            saveToStorage(player);
                            updateSkills();
                            
                            // check if child skills are available 
                            // and if they are make them unlockable
                            for(let i = 0; i < e.children.length; i++) {
                                const tree_node = tree[e.children[i]];

                                let unlocked = true;
                                // check if child has all required skills unlocked
                                for(let j = 0; j < tree_node.require.length; j++) {
                                    if(!player.skills.has(tree_node.require[i])) {
                                        unlocked = false;
                                        continue;
                                    }
                                }

                                if(unlocked) {
                                    const child_skill = cont.querySelector(`#st_${e.children[i]}`)
                                    
                                    child_skill.classList.remove('not-unlockable');
                                    child_skill.querySelector('.skill-buy-btn').removeAttribute('disabled');
                                }
                            }

                            // Change connecting line color
                            CreateAnimation(p => {
                                ctx.strokeStyle = 'white';
                                ctx.lineWidth = 2;

                                // ease function
                                p = math.smootherstep(p, 0, 1);

                                for(let j = 0; j < e.require.length; j++) {
                                    const sk = tree[e.require[j]];
                                
                                    const path = new Path2D();
                                        // sk.y < e.y, y1 < y2
                                        const x1 = vh * ( sk.x );
                                        const y1 = height - vh * (sk.y * 5 + h);
                                        const x2 = vh * ( e.x );
                                        const y2 = height - vh * ( e.y * 5);

                                        const mid = (y2+y1)/2;
                                        const l1 = Math.abs(mid - y1);
                                        const l2 = Math.abs(x2 - x1);
                                        const l3 = Math.abs(y2 - mid);
                                        const t = l1 + l2 + l3;
                                        
                                        const p1 = math.sat(p/(l1/t));
                                        const p2 = math.sat((p-l1/t)/(l2/t));
                                        const p3 = math.sat((p-(l1+l2)/t)/(l3/t));

                                        path.moveTo(x1, y1);
                                        path.lineTo(x1, math.lerp(p1, y1, mid));
                                        if(p2 > 0) path.lineTo(math.lerp(p2, x1, x2), mid);
                                        if(p3 > 0) path.lineTo(x2, math.lerp(p3, mid, y2));

                                    ctx.stroke(path);
                                }
                            
                                ctx.strokeStyle = null;
                                ctx.strokeWidth = null;
                            }, 800).promise.then(() => skill.classList.remove('locked'));
                        })
                        .newChild('div')
                            .text(`${sk.cost} SP`)
                            .style({fontSize: '1.32em'})
                            .end
                        .end
                })

                .appendTo(skill)
        }

        cont.appendChild(skill);

        // Render lines connecting to other skills 
        if(e.require == undefined || e.require.length == 0) continue;
        
        if(!locked) {
            for(let j = 0; j < e.require.length; j++) {
                const sk = tree[e.require[j]];
                unlockedPointsToDraw.push({
                    x1:vh * ( sk.x ),
                    y1:height - vh * (sk.y * 5 + h),
                    x2:vh * ( e.x ),
                    y2:height - vh * ( e.y * 5 )
                });
            }
            continue;
        }

        ctx.strokeStyle = 'rgba(127, 127, 127)';
        ctx.lineWidth = 2;

        for(let j = 0; j < e.require.length; j++) {
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
    }

    // Unlocked skill lines are drawn after to achieve layering
    ctx.strokeStyle = 'rgba(255, 255, 255, 255)';
    ctx.lineWidth = 2;

    for(let i = 0; i < unlockedPointsToDraw.length; i++) {
        const {x1, y1, x2, y2} = unlockedPointsToDraw[i];
        const path = new Path2D();
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


export const stat_menu = {
    show: () => {
        
    },
    hide: () => {

    },
    init: () => {
        document.getElementById('stat-menu-btn').addEventListener('click', () => { 
            menu_container.style.display = 'block';
            createStatMenu(menu_container);
        })
    }
}