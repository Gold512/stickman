import * as clients from '../objects/objects.js'
import { ElementCreator } from '../classes/element_creator.js';
import { camera, speed } from '../module/calc.js';
import { Bitfield } from '../module/bitfield.js';
import { toggleInspect } from './dev_tools_inspect.js';

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

let devtoolStateBitfield = new Bitfield([
    'inspect',
    'noclip',
    'infinite',
    'paused',
    'speedup'
]);

let checkState = devtoolStateBitfield.toJSON(parseInt(new URL(location.href).searchParams.get('state') ?? '0', 36));

function saveStates() {
    let url = new URL(window.location.href);

    let checkboxes = document.querySelectorAll('.dev-tool-checkbox');
    let json = {};
    for(let i = 0; i < checkboxes.length; i++) {
        json[checkboxes[i].dataset.label] = checkboxes[i].checked;
    }

    url.searchParams.set('state', devtoolStateBitfield.toBits(json).toString(36));
    window.history.replaceState('', '', url);
}

export function init() {
    /**
     * @returns {function():function(any, ElementCreator)}
     */
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
                    .class('dev-tool-checkbox')
                    .dataset('label', label)
                    .attribute('type', 'checkbox')
                    .if(checkState[label], e => { 
                        e.element.checked = true;
                        dev[label](true);
                    })
                    .addEventListener('change', ev => {
                        ev.currentTarget.blur();
                        dev[label](ev.currentTarget.checked);

                        saveStates();
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
        .exec(addCheckBox('speedup'))
        .newChild('label')
            .newChild('span').id('zoom-display')
                .text('50')
                .end
            .newChild('input')
                .attribute('type', 'range')
                .attribute('min', '10')
                .attribute('max', '100')
                .attribute('step', '10')
                .style({
                    width: '5em'
                })

                .addEventListener('change', ev => {
                    camera.scale = parseInt(ev.currentTarget.value)
                    ev.currentTarget.parentElement.children[0].innerText = camera.scale;

                    
                })
                .addEventListener('mouseup', ev => { ev.currentTarget.blur(); })
                .end
            .end
        .newChild('button')
            .addEventListener('click', ev => {
                player.health = player.stats.maxHealth;
                ev.currentTarget.blur();
            })
            .text('Heal')
            .style({
                transform: 'translateX(25%)',
                display: 'block',
                marginBottom: '3px'
            })
            .end
        .newChild('button')
            .addEventListener('click', () => {
                if(!confirm('Confirm reset save')) return;
                localStorage.removeItem('save');
                location.reload();
            })
            .text('Reset')
            .style({
                display: 'block',
                transform: 'translateX(25%)'
            })
            .end

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

    edit: (state = true) => {
        document.addEventListener('click', event => {
        
        });
    },

    // display info about the tile that is hovered over
    inspect: toggleInspect,

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
            player.collision.type = 'active';
            player.RemoveTag('NoGravity');
            player._gravity = 0;
        }
    },

    speedup(state = true) {
        if(state) {
            player.speed = 15;
        } else {
            player.speed = speed.move;
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

    regenerateWorld() {
        const save = JSON.parse(window.localStorage.save);
        delete save.grid;
        window.localStorage.save = JSON.stringify(save);
        location.reload();
    },

    /**
     * 
     * @param {string} [resultLocation] the name of the property of window to assign the result to
     */
    importAll(resultLocation = null) {
        const src = [
            'module/svg',
            'module/math',
            'ui/character',
            'ui/interaction',
            'ui/modal',
            'skill',
            'spacial_hash',
            'objects/objects',
            'save',
            'objects/enemies',
            'module/worldgen',
            'classes/element_creator',
            'module/calc'
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
    },

    import(src) {
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

        return promise;
    },

    get exit() {
        let url = new URL(location.href);
        url.searchParams.delete('dev');
        url.searchParams.delete('state');
        location.replace(url);
    },

    async validateClasses() {
        const exports = await this.import([
            'spacial_hash',
            'objects/objects',
            'objects/enemies'
        ]);
        console.log(exports)
        for(let i in exports) {
            const e = exports[i];
            if(e === undefined) continue;

            if(!e.from) console.error(`${i} - Missing 'from' static method`);
            if(!e.prototype.toJSON) console.error(`${i} - Missing 'toJSON' instance method`);
        }
    },

    repairSave() {
        let save = JSON.parse(localStorage.save);

        console.info('Attempting to validate object list...')

        let errs = 0;
        // repair object list
        let newObjectList = [];
        for(let i = 0; i < save.grid.clients; i++) {
            if(save.grid.clients[i].hasOwnProperty('constructor')) {
                newObjectList.push(save.grid.clients[i]);
            } else {
                console.info('Deleting client at index ' + i, save.grid.clients[i]);
                errs++;
            }
        }

        save.grid.clients = newObjectList;

        console.info(`Validated object list; found ${errs} erratic objects`)

        localStorage.save = JSON.stringify(save);
    }
}