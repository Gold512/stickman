import { speech } from '../ui/interaction.js'
import { math } from '../libs/math.js'

function* IDGeneratorFactory() {
    let idx = 0;
    while(true) {
        yield idx.toString(36);
        idx++;
    }
}

// play some interactable event
// this should do stuff like 
// quest interaction 
// tutorial or an animation
// can have steps or branches triggered by different events
export class Stage {
    /**
     * 
     * @param {SpatialHash} grid 
     */
    constructor(grid) {
        // Clients to remove after the stage ends 
        this.clients = [];
        this.grid = grid;
        this.idTable = {};

        this.functions = {};
        this.getNextID = IDGeneratorFactory();

        this.events = {
            animationEnd: {}
        }
    }

    /**
     * 
     * @param {Client|string} client
     * @param {('animationEnd')} event 
     * @param {function(Client):void} callback 
     */
    addEvent(client, event, callback) {
        client = this._ResolveClient(client);
        this.events.animationEnd[client.id] = callback;
    }

    /**
     *  add a client to the stage. If the client is not already in a grid it will be added to the grid in the 
     * context of the stage
     * @param {Client} client
     * @param {String} name the name to refer to the client as. May be used as to reference client in place of an ID or reference in other methods.
     */
    addClient(client, name = '') {
        if(!client.inGrid) {
            this.clients.push(client);
            this.grid.InsertClient(client);
        }

        // allow for custom string names for the clients
        // to allow easier referencing of each client 
        if(name) {
            if(this.idTable.hasOwnProperty(name)) throw new Error(`Already assigned client to name ${name}`);
            this.idTable[name] = client;
        }
    }

    /**
     * move a client within an animation
     * @param {Client|String} client reference to client or its name 
     * @param {[number, number]} endPos end position that the client will be moved to 
     * @param {number} duration the time in milliseconds that the animation will take
     */
    moveClient(client, endPos, duration) {
        client = this._ResolveClient(client);

        const ID = this.getNextID.next().value;
        const startPos = structuredClone(client.position);
        this.functions[ID] = ['move', client, startPos, endPos, duration, null]
    }

    /**
     * 
     * @param {Client|String} client reference to client or its name 
     * @param {Object[]} movements
     * @param {[number, number]} movements[].pos position to end this movement segment at
     * @param {number} movements[].duration duration of the segment in milliseconds 
     */
    multiMoveClient(client, movements) {
        client = this._ResolveClient(client);

        const ID = this.getNextID.next().value;
        const startPos = structuredClone(client.position);
        const segment = movements.shift();

        this.functions[ID] = ['move', client, startPos, segment.pos, segment.duration, movements]
    }

    /**
     * @typedef {object} Button 
     * @property {string} text the text of the button 
     * @property {function():void} callback function to call when the button is clicked
     * @property {boolean} [close] whether to close the current box after the callback 
     *                             default:
     *                               - true when ref is unset 
     *                               - false when ref is set
     * @property {string} ref the ID of the page to go to after the button is clicked      
     */

    /**
     * A page in speech or interaction
     * usually with a 'living' character
     * @typedef {object} Subpage
     * @property {string} [text] - the speech said by the client 
     * @property {Button[]} [buttons] - buttons to use, defaults to 'Ok' which just closes the speech or
     *                                       goes to the next page if any 
     */

    /**
     * A page in speech or interaction
     * usually with a 'living' character
     * this is just convenience access to the speech function of interaction
     * @param {object} options
     * @param {string} [options.text] - the speech said by the client 
     * @param {Button[]} [options.buttons] - buttons to use, defaults to 'Ok' which just closes the speech or
     *                                       goes to the next page if any
     * @param {Object.<string, Subpage>} [options.pages] - other pages of the interaction with the key of the page being its ID
     * 
     */
    sayAsClient(client, options) {
        speech(client, options)
    }

    // trigger the stage
    Trigger() {

    }

    /**
     * tick function to be called every rendering frame
     * @param {number} dt elapsed time between this frame and the previous frame in milliseconds
     */
    Tick(dt) {
        for(let i = 0, k = Object.keys(this.functions); i < k.length; i++) {
            const e = this.functions[k[i]];
            switch(e[0]) {
                case 'move':
                    const [operation, client, startPos, endPos, duration, extra] = e;
                    const t = dt / duration;
                    client.position = math.lerp2d(t, startPos, endPos);
                    
                    // end of animation
                    if(t >= 1) {
                        if(extra && extra.length >= 1) {
                            const segment = extra.shift();
                            this.functions[k[i]] = [operation, client, endPos, segment.pos, segment.duration, extra];
                        } else {
                            delete this.functions[k[i]];
                        
                            const callback = this.events.animationEnd[client.id];
                            if(callback) callback(client);
                        }
                    }

                    break;
            }
        }
    }

    _ResolveClient(client) {
        if(typeof client === 'string') {
            const c = this.idTable[client];
            if(!c) throw new Error(`client of name '${client}' not found`);
            return c;
        }

        return client;
    }
}