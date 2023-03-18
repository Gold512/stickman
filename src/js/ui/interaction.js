import { ElementCreator } from '../classes/element_creator.js'

// define the container for all UI elements
function getContainer() {
    return document.getElementById('menu');
}

/**
 * Open a list-like menu of buttons
 * @param {String} text text to display
 * @param {Object} options - change behaviour of interactive
 * @param {Number} [options.x] - x position of interactive element
 * @param {Number} [options.y] - y position of interactive element
 * @param {Object[]} [options.options] - options for interaction
 * @param {Boolean} [options.options[].close] - whether to close interactive element when option chosen, defaults to true
 * @param {Boolean} [options.options[].onClose] - called when interactive UI is closed
 * @param {String} options.options[].text - option text
 * @param {('button'|'scroll')} [options.options[].type] - control type; defaults to 'button'
 * @param {Function} [options.options[].callback] - option click handler
 */
export function newInteractive(text, {x, y, options = [], onClose = null} = {}) {
    const container = getContainer()

    new ElementCreator('div')
        .class('interactive-ui')
        .style({
            transform: `translate(${x}px, ${y}px)`
        })

        // text container
        .newChild('div')
            .class('text')
            .text(text)
            .end

        .newChild('div')
            .class('buttons')
            .exec((_, o) => {
                function close(ev) {
                    if(ev && ev.target.matches('#menu *')) return;
                    const menu = document.getElementById('menu');

                    menu.children[0].remove();
                    menu.style.display = '';
                    document.removeEventListener('click', close);
                    if(onClose) onClose();
                }

                function scroll(ev, e, n) {
                    const textContainer = ev.currentTarget.parentElement.children[1];
                    let index = Number(textContainer.dataset.index);
                    index += n;
                    if(index >= e.text.length) {
                        index = 0;
                    } else if(index == -1) {
                        index = e.text.length - 1;
                    }

                    textContainer.dataset.index = index;
                    textContainer.innerText = e.text[index];

                    return e.text[index];
                }
                
                for (let i = 0; i < options.length; i++) {
                    const e = options[i];
                    switch(e.type) {
                        case 'scroll':
                            o.newChild('div')
                                .class('interactive-scroll')
                                .newChild('button')
                                    .class('interactive-left')
                                    .addEventListener('click', ev => {
                                        let txt = scroll(ev, e, -1);
                                        if(e.callback) e.callback(ev, txt)
                                    })
                                    .end

                                .newChild('span')
                                    .text(e.text[0])
                                    .dataset('index', 0)
                                    .end

                                .newChild('button')
                                    .class('interactive-right')
                                    .addEventListener('click', ev => {
                                        let txt = scroll(ev, e, 1);
                                        if(e.callback) e.callback(ev, txt)
                                    })
                                    .end
                                .end
                        break;
                        default:
                        case 'button': 
                            o.newChild('button')
                                .text(e.text)
                                .addEventListener('click', ev => {
                                    if(e.close === undefined || e.close === true) close();
                                    e.callback(ev);
                                })
                                .end
                    }
                    
                    
                }


                // close button
                o.newChild('button')
                    .text('Close')
                    .addEventListener('click', () => close())
                    .end

                // click anywhere else to close as well
                // add listener after this function is complete so that 
                // it will not be instantly closed due to the click needed
                // to open the menu
                setTimeout( () => document.addEventListener('click', close), 1);
            })
            .end

        .appendTo(container, true);

    container.style.display = 'block';
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
 * @param {Client} client the client that is performing the speech action
 * @param {object} options
 * @param {string} [options.text] - the speech said by the client 
 * @param {Button[]} [options.buttons] - buttons to use, defaults to 'Ok' which just closes the speech or
 *                                       goes to the next page if any
 * @param {Object.<string, Subpage>} [options.pages] - other pages of the interaction with the key of the page being its ID
 * 
 */
export function speech(client, options) {
    new ElementCreator('div')
        .class('speech-ui')
        .text(text)

        .if(Object.keys(buttons).length > 0, o => {
            o.newChild('div')
                .class('speech-ui-btn-container')
                .exec((_, o) => {
                    for(let i = 0, k = Object.keys(buttons); i < k.length; i++) {
                        const e = buttons[k[i]];
                        o.newChild('button')
                            .class('speech-ui-button')
                            .text(e.text ?? '')
                            .end
                    }
                })
            
        })
        .appendTo(getContainer());
}