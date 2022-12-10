import * as clients from '../objects.js'
import { ElementCreator } from '../classes/element_creator.js';
import { camera, speed } from '../module/calc.js';

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
            'border-radius': '.25em'
        })
        .text('inspect')
        .addEventListener('click', () => dev.inspect())
        .appendTo(document.body);
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
    inspect: state => {
        const inspectOverlay = new ElementCreator('div')
            .style({
                position: 'fixed',
                left: '0',
                top: '0',
                zIndex: '9999',
                width: `${camera.scale}px`,
                height: `${camera.scale}px`,
                background: 'rgb(200 0 0 / 30%)'
            })
            .newChild('pre')
                .style({
                    position: 'absolute',
                    top: '-20%',
                    left: '25%',
                    transform: 'translateY(-100%)',
                    background: 'lightgray',
                    border: '1px solid black',
                    padding: '6px 3px'
                })
                .end

            .appendTo(document.body);

        let txt = inspectOverlay.querySelector('pre')
        let mousePos = [], frozen = false

        document.addEventListener('mousemove', ev => {
            frozen = ev.getModifierState('Alt') || ev.getModifierState('Cntrl')
            if(frozen) return;

            mousePos = [ev.clientX, ev.clientY];
            const pos = camera.getTile(mousePos[0], mousePos[1]);
            inspectOverlay.style.transform = `translate(${Math.floor(pos[0]) * camera.scale + camera.offset[0]}px, ${Math.floor(pos[1]) * camera.scale + camera.offset[1]}px)`;
        });

        setInterval(() => {
            if(frozen || (mousePos[0] === undefined)) return;

            const pos = camera.getTile(mousePos[0], mousePos[1]);
            // inspectOverlay.style.transform = `translate(${Math.floor(pos[0]) * camera.scale + camera.offset[0]}px, ${Math.floor(pos[1]) * camera.scale + camera.offset[1]}px)`;
            let idx = grid._GetCellIndex([Math.floor(pos[0]), Math.floor(pos[1])]);
            let cell = grid._cells[idx[0]][idx[1]];
            
            let text = `[${pos[0]}, ${pos[1]}] (cell: ${idx[0]}, ${idx[1]})\n`;
            txt.innerText = '';
            if(!cell || !cell.client) {
                txt.innerText = text;
                return;
            }


            while(cell?.client) {
                let client = cell.client;

                let line = `${client.constructor.name}\n`
                if(client.id) line += ` - ID: ${client.id}\n`;
                if(client.health) line += ` - Health: ${client.health}\n`;
                if(client.mana) line += ` - Mana: ${client.mana}\n`;

                text += `${line}\n------\n`;
                cell = cell.next;
            }

            txt.innerText = text.slice(0, -7);
            
        }, 100)
    },

    infinite(state = true) {
        if(state) {
            Object.defineProperty(player.stats, 'health', {get: () => player.stats.maxHealth, set(){}});
            Object.defineProperty(player.stats, 'mana', {get: () => player.stats.maxMana, set(){}});
            return;
        }

        Object.defineProperty(player.stats, 'health', {value: player.stats.maxHealth});
        Object.defineProperty(player.stats, 'mana', {value:  player.stats.maxMana});
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
    }
}