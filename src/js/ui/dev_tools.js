import * as clients from '../objects.js'
import { ElementCreator } from '../classes/element_creator.js';
import { camera, speed } from '../module/calc.js';
import { Vector } from '../module/vector.js';

function parsePos(s) {
    const pos = s.split(',');
    for(let i = 0; i < pos.length; i++) {
        pos[i] = pos[i].trim();
        if(pos[i][0] == '~') {
            pos[i] = player.position[i] + Number(pos[i].slice(1));
        } else {
            pos[i] = Number(pos[i]);
        }

        if(isNaN(pos[i])) throw new Error(`invalid position '${s}'`);
    }
    return pos;
}

export function init() {
    function addCheckBox(label) {
        return (_, elementCreator) => {
            elementCreator.newChild('label')
                .style({
                    display: 'block',
                    paddingLeft: '22px',
                    textIndent: '-22px'
                })
                .newChild('span').style({'vertical-align': 'middle'})
                    .text(label)
                    .end
                .newChild('input').style({'vertical-align': 'middle'})
                    .attribute('type', 'checkbox')
                    .addEventListener('change', ev => {
                        ev.currentTarget.blur();
                        dev[label](ev.currentTarget.checked)
                    })
                    .end
                .end
        }
    }

    new ElementCreator('div')
        .style({
            position: 'fixed',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgb(0 0 0 / 60%)',
            border: '1px solid gray',
            padding: '2px 5px',
            color: 'lightgray',
            borderRadius: '.25em',
            textAlign: 'right'
        })
        .exec(addCheckBox('inspect'))
        .exec(addCheckBox('noclip'))
        .exec(addCheckBox('infinite'))
        .exec(addCheckBox('paused'))

        .appendTo(document.body);

    // defualt export access location
    dev.importAll().then(v => dev.exports = v)
}

// define dev functions to global scope
export const dev = {
    _data: {},
    repeat: (fn, n, ...args) => {
        if(typeof fn == 'string') {
            for(let i = 0; i < n; i++) {
                this[fn](...args)
            }
        } else {
            for(let i = 0; i < n; i++) {
                fn(...args);
            }
        }
        
    },

    summon: (client, pos, dimensions, ...args) => {
        let obj = clients[client];
        if(!obj) throw new Error(`client of type ${client} does not exist`);
        pos = parsePos(pos);
        obj = new obj(pos, dimensions, ...args);
        grid.InsertClient(obj);
    },

    clear: () => {
        for(let i = 0, k = Object.keys(grid._idTable); i < k.length; i++) {
            const e = grid._idTable[k[i]];
            if(!(e instanceof clients.PlayerClient)) grid.Remove(e);
        }
    },

    // display info about the tile that is hovered over
    inspect: (state=true) => {
        if(!state) {
            if(dev._data.inspect) {
                const o = dev._data.inspect;
                o.inspectOverlay.remove();
                clearInterval(o.intervalID);
            }
            
            return;
        }

        const inspectOverlay = new ElementCreator('div')
            .style({
                position: 'fixed',
                left: '0',
                top: '0',
                zIndex: '9999',
                width: `${camera.scale}px`,
                height: `${camera.scale}px`,
                background: 'rgb(200 0 0 / 30%)',
                pointerEvents: 'none'
            })
            .newChild('pre')
                .style({
                    position: 'absolute',
                    top: '-20%',
                    left: '25%',
                    transform: 'translateY(-100%)',
                    background: 'lightgray',
                    border: '1px solid black',
                    padding: '6px 3px',
                    pointerEvents: 'all'
                })
                .end

            .appendTo(document.body);

        let txt = inspectOverlay.querySelector('pre');
        let mousePos = [], frozen = false, shiftLock = false, lastPos = [];
        const MAX_DOUBLE_CLICK_INTERVAL = 200;

        function positionOverlay(position) {
            inspectOverlay.style.transform = `translate(${Math.floor(position[0]) * camera.scale + camera.offset[0]}px, ${Math.floor(position[1]) * camera.scale + camera.offset[1]}px)`
        }

        // freeze lock 
        let hasShifted = false;
        document.addEventListener('keyup', event => {
            if(event.key !== 'Shift') return;

            hasShifted = true;
            setTimeout(() => { hasShifted = false; }, MAX_DOUBLE_CLICK_INTERVAL);
        });

        document.addEventListener('keydown', event => {
            if(event.key !== 'Shift') return;

            // if shiftlock is on a single shift will disable it 
            if(shiftLock) {
                shiftLock = false;
                inspectOverlay.style.width = camera.scale + 'px';
                inspectOverlay.style.height = camera.scale + 'px';
                return;
            }

            if(hasShifted) {
                lastPos = camera.getTile(mousePos[0], mousePos[1]);
                shiftLock = true;
            }
        })

        document.addEventListener('mousemove', ev => {
            frozen = shiftLock || ev.getModifierState('Shift');
            if(frozen) return;

            mousePos = [ev.clientX, ev.clientY];
            const pos = camera.getTile(mousePos[0], mousePos[1]);
            positionOverlay(pos);
        });

        // Shift click
        document.addEventListener('click', event => {
            if(!event.getModifierState('Shift')) return;

            const pos = camera.getTile(event.clientX, event.clientY);
            let idx = grid._GetCellIndex([Math.floor(pos[0]), Math.floor(pos[1])]);
            let cell = grid._cells[idx[0]][idx[1]];
            
            if(!cell || !cell.client) return;

            let client = cell.client;
            shiftLock = true;
            positionOverlay(client.position);
            let size = Vector.multiply(client.dimensions, camera.scale);
            inspectOverlay.style.width = size[0] + 'px';
            inspectOverlay.style.height = size[1] + 'px';

            let originalDimensions;

            /**
             * 
             * @param {number} n the number to convert in tiles
             * @param {number} index 0 - x, 1 - y (the equavalant index of a positional array)
             * @returns 
             */
            function convertToPixels(n, index = 0) {
                return n * camera.scale + camera.offset[index]
            }

            let dragEvent = {
                left: ev => {
                    const x = ev.clientX;

                    inspectOverlay.style.transform = `translate(${x}px, ${convertToPixels(originalDimensions.top,1)}px)`
                    inspectOverlay.style.width = convertToPixels(originalDimensions.left - x / camera.scale + originalDimensions.width, 0) + 'px';
                }
            }
            
            function dragStart(clickX, clickY, direction) {
                console.log('dragStart')
                originalDimensions = {
                    left: client.position[0],
                    top: client.position[1],
                    width: client.dimensions[0],
                    height: client.dimensions[1],
                    clickX, clickY
                }

                document.addEventListener('mousemove', dragEvent[direction]);
                document.addEventListener('mouseup', () => { dragEnd(direction) });
            }

            function dragEnd(direction) {
                document.removeEventListener('mousemove', dragEvent[direction]);
                document.removeEventListener('mouseup', dragEnd);
            }
            
            // resize and reposition tools 
            new ElementCreator('div').id('object.editor')
                .style({
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    width: '100%',
                    height: '100%',
                })
                .newChild('div').id('left')
                    .style({
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        height: '100%',
                        width: '8px'
                    })
                    .addEventListener('mousedown', ev => { dragStart(ev.clientX, ev.clientY, 'left') })
                    .end
                .appendTo(inspectOverlay);

            inspectOverlay.style.pointerEvents = ''
        })

        let intervalID = setInterval(() => {
            if(frozen || (mousePos[0] === undefined)) {
                // update 4x as frequently as repositioning is cheap
                positionOverlay(lastPos);
                setTimeout(positionOverlay, 25, lastPos);
                setTimeout(positionOverlay, 50, lastPos);
                setTimeout(positionOverlay, 75, lastPos);
                return;
            }

            const pos = camera.getTile(mousePos[0], mousePos[1]);
            positionOverlay(pos)
            let idx = grid._GetCellIndex([Math.floor(pos[0]), Math.floor(pos[1])]);
            let cell = grid._cells[idx[0]][idx[1]];
            
            let text = `[${pos[0]}, ${pos[1]}] (cell: ${idx[0]}, ${idx[1]})\n`;
            txt.innerText = '';
            if(!cell || !cell.client) {
                txt.innerText = text;
                return;
            }

            const sectionEnd = '\n------\n';
            while(cell?.client) {
                let client = cell.client;

                let line = `${client.constructor.name}\n`
                if(client.id) line += ` - ID: ${client.id}\n`;
                if(client.dimensions) line += ` - Size: [${client.dimensions[0].toFixed(3)}, ${client.dimensions[1].toFixed(3)}]\n`;
                if(client.health) line += ` - Health: ${client.health}\n`;
                if(client.mana) line += ` - Mana: ${client.mana}\n`;

                text += `${line}${sectionEnd}`;
                cell = cell.next;
            }
            text = text.slice(0, -sectionEnd.length);
            if(shiftLock) text += '[Shift Lock Enabled]';
            txt.innerText = text;
            
        }, 100);

        dev._data.inspect = {
            intervalID, 
            inspectOverlay
        }
    },

    infinite(state = true) {
        if(state) {
            Object.defineProperty(player.stats, 'health', {get: () => player.stats.maxHealth, set(){}});
            Object.defineProperty(player.stats, 'mana', {get: () => player.stats.maxMana, set(){}});
            return;
        }
        const config = {
            configurable: true,
            writable: true
        }

        Object.defineProperty(player.stats, 'health', {value: player.stats.maxHealth, ...config});
        Object.defineProperty(player.stats, 'mana', {value:  player.stats.maxMana, ...config});
    },

    /**
     * Call exported function
     * @param {String} fn <path (no .js extension)><'.' seperated JS object path>
     * @param  {...any} args 
     * @returns 
     */
    call: async (fn, ...args) => {
        // const path = fn.split('.');
        // import(`../${path[0]}.js`).then(o => {
        //     for(let i = 1; i < path.length; i++) {
        //         if(o[path[i]] === undefined) throw new Error(`No function at path '${fn}', ensure that function is exported`);
        //         o = o[path[i]];
        //     }

        //     try {
        //         o(...args);
        //     } catch(e) { throw e; }
        // })

        const f = await dev.get(fn);
        return f(...args);
    },

    // expose exported objects
    get: path => {
        let resolve, reject;
        const promise = new Promise((res, rej) => {resolve = res, reject = rej})
        
        path = path.split('.');
        import(`../${path[0]}.js`).then(o => {
            for(let i = 1; i < path.length; i++) {
                if(o[path[i]] === undefined) throw new Error(`No function at path '${fn}', ensure that function is exported`);
                o = o[path[i]];
            }

            resolve(o)
        });

        return promise;
    },

    log: () => { 
        let path;
        try {
            throw new Error();
        } catch(e) {path = e.stack.replace('Error', '')}
        console.log(`called ${path}`);
    },

    noclip(state = true) {
        if(state) {
            player.collision.type = 'none';
            player.AddTag('NoGravity');
        } else {
            player.collision.type = 'passive';
            player.RemoveTag('NoGravity');
        }
    },
    
    speed(n) {
        if(!n) {
            player.speed = speed.move;
            return;
        }

        player.speed = n;
    },

    paused(state) {
        grid.paused = state;
    },

    /**
     * 
     * @param {string} [resultLocation] the name of the property of window to assign the result to
     */
    importAll(resultLocation = null) {
        const src = [
            'ui/character',
            'ui/interaction',
            'ui/modal',
            'skill',
            'objects',
            'save'
        ]


        let queue = [];
        for(let i in src) {
            queue.push(dev.get(src[i]));
        }

        let promise = Promise.all(queue).then(results => {
            let res = {};

            for(let i in results) {
                for(let j in results[i]) {
                    res[j] = results[i][j];
                }
            }
            return res;
        });

        if(resultLocation !== null) {
            promise.then(v => window[resultLocation] = v)
        }

        return promise;
    }
}