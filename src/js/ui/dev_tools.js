import * as clients from '../objects.js'
import { ElementCreator } from '../classes/element_creator.js';

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
        const e = new ElementCreator('div')
            .style({
                position: 'fixed',
                top: '0',
                left: '0',
                width: '15em',
                height: '5em',
                zIndex: '9999'
            })
            .appendTo(document.body);

        this._data.inspect = e;

        document.addEventListener('mousemove', ev => {
            
            const pos = [(ev.clientX - offset[0])/scale, (ev.clientY - offset[1])/scale];
        });
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
    }
}