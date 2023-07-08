// development commands for dev tools 

// expose creatable clients 
import * as clients from '../object.js';
import Client from '../spacial_hash.js';

/**
 * Public command execution
 * @param {string} s command string
 */
export function executeCommand(s, caller = player) {
    // parse 
    let commandName = '';
    let idx = 0;

    // append null to character array as a end of input
    s = s.split('');
    s.push(null);

    for(let i = 0; i < s.length; i++) {
        const c = s[i];

        if(c === ' ') {
            idx = i;
            break;
        }

        commandName += c;
    }

    // run the command 
    let commandSymbols = commandParams[commandName]

    if(!commandSymbols) throw new Error(`command '${commandName}' not found`);

    let symbols = [];

    for(let i = 0; i < commandSymbols.length; i++) {
        idx++;

        let generator = commandSymbols[i].Generator();
        generator.next(s[idx]);

        while(true) {
            idx++
            let r = generator.next();
            if(generator.done) symbols.push(r);
        }
    }

    let cmdFunc = commandFunctions[commandName];
    throw new Error(`Function body for '${commandName}' not found`);

    // resolve symbols
    if(cmdNoAutoResolve.has(commandName)) {
        for(let i = 0; i < symbols.length; i++) symbols[i] = symbols[i].Resolve(caller);
    }
    
    cmdFunc(caller, ...symbols);
}

// +==================+
// | Argument Classes |
// +==================+

// GRAMMAR: <vector X> <vector Y>
// Resolves any contextual vectors to absolute positions (vector relative to origin)
class Symbol_Position {
    constructor(data) {
        this.pos = [Number(data.pos[0]), Number(data.pos[1])];
        this.relative = data.relative;
    }

    /**
     * 
     * @param {Client} caller 
     */
    Resolve(caller) {
        let finalPos = [0, 0];
        
        for(let i = 0; i < this.relative.length; i++) {
            if(this.relative[i]) finalPos[i] = caller.position[i];
        }

    }

    static *Generator() {
        let pos = [''];
        let relative = [false, false];

        let idx = 0;
        while(true) {
            
            let c = yield;
            switch(c) {
                case ' ':
                    idx++;

                    if(idx === 2) {
                        return new this({pos, relative});
                        return;
                    }
                    break;

                case '~':
                    // prevent double ~
                    if(relative[idx]) throw new Error("Unexpected Character '~'")
                    
                    relative[idx] = true;
                    break;
                
                case null:
                    if(pos.length < 2) throw new Error('Unexpected end of input, incomplete position symbol')
                    break;

                default: 
                    pos[idx] += c;
                    break;
            }
        }
    }

    static toString() {
        return '<Position:x y>'
    }
}

class Symbol_Client {
    constructor(data) {
        this.name = data.name;
        this.data = data.data;
    }

    Resolve(caller) {
        let newClient = clients[this.name]();
        for(let i in this.data) {
            newClient[i] = this.data[i];
        }

        return newClient;
    }

    static *Generator() {
        let name, data;

        let idx = 0;
        let nesting = 0;
        while(true) {
            let c = yield;

            switch(c) {
                case '{' : 
                    this.data = JSON.parse(s[i].slice(i));
                    nesting++;
                    break;
                
                case '}':
                    nesting--;
                    break;

                case ' ':
                    if(nesting !== 0) break;
                    return new this({name, data});
                    break;

                case null:
                    if(nesting !== 0) throw new Error('Unexpected end of input, unterminated Client data JSON');
                    break;

                default:
                    this.name += c;
            }
        }
    }

    static validation = {
        name: clients.keys(),
        data: {
            Enemy: ['health','dmg', 'skills']
        }
    }

    static toString() {
        return '<Client>'
    }
}

/* SYMBOL GRAMMAR
Usage:
    - #<ID>: shorthand for selecting client by id 
    - .<TYPE>: shorthand for selecting client by class type
    - <JSON>: curly braces encased JSON selector:
        type<string>: type of client 
        origin<[number, number]>: center point of search if bounds is defined 
        bounds<[number, number]>: width and height of the search area. The top left corner will be (x - width/2, y - height/2) 
*/
class Symbol_Selector {
    constructor(data) {
        this.selector = data;
    }

    Resolve(caller) {
        return caller.grid.ClientSelector(this.selector)
    }

    static *Generator() {
        let type;

        let c = yield;

        switch(c) {
            // expect [a-zA-Z0-9]
            case '#':
                let id = '';

                while(true) {
                    let c = yield;

                    // if a space or null is found it should be the end of input
                    if(c === ' ' || c === null) {
                        return new this({id});
                    }

                    if(!c.match(/[a-zA-Z0-9]/)) throw new Error(`SyntaxError: Unexpected character '${c}'`);
                    id += c;

                }
                break;
            
            case '.':
                // type selector
                let type = '';

                while(true) {
                    let c = yield;
                    if(c === ' ' || c === null) return new this({type});
                }
                
                break;
            
            case '{':
                let json = '';
                let nesting = 0;

                while(true) {
                    let c = yield;

                    switch(c) {
                        case '{':
                            nesting++;
                            break;
                        
                        case '}':
                            nesting--;
                            break;
                        
                        case ' ':
                        case null:
                            if(nesting !== 0) break;

                            return new this(JSON.parse(json));

                            break;
                    }
                }
                break;
        }
        
    }

    static toString() {
        return '<Selector>'
    }
}

// Basic string 
class Symbol_String {
    constructor(str) {
        this.str = str;
    }

    Resolve() {
        return this.str
    }

    static *Generator() {
        let str = '';

        while(true) {
            let c = yield;

            switch(c) {
                case ' ':
                case null:
                    return new this(str);
                    break;

                default: 
                    str += c;
                    break;
            }
        }
    }
}

// Keyword symbol constructor for sumcommand support
function Symbol_Keyword_Factory(keywords) {
    return class Symbol_Keyword {
        constructor(keyword) {
            this.keyword = keyword;
        }

        Resolve(_) {
            return this.keyword;
        }

        static *Generator() {
            let chars = '';
            while(true) {
                let c = yield;

                if(c === ' ') {
                    if(!keywords.includes(chars)) throw new Error(`invalid keyword argument '${chars}'`)
                    return new this(chars);
                }

                chars += c;
            }
        }

        static toString() {
            return `<'${keywords.join("'|'")}'>`;
        }
    }
}

// +===================+
// | Command functions |
// +===================+

const cmdNoAutoResolve = new Set([
    'for'
])

const commandFunctions = {
    summon(caller, client, position) {
        client.position = position;
        caller.grid.InsertClient(client);
    },

    for(caller, selector) {

    }
}

const commandSymbols = {
    summon: [Symbol_Client, Symbol_Position],
    kill: [Symbol_Selector],
    data: [Symbol_Selector, Symbol_Keyword_Factory(['set', 'get'])]
}

// +=================+
// Autocomplete data |
// +=================+

const cmdAutocomplete = {
    
}