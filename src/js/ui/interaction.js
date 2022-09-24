import { ElementCreator } from '../libs/element_creator.js'
// text interaction

/**
 * 
 * @param {String} text text to display
 * @param {Object} options - change behaviour of interactive
 * @param {Number} [options.x] - x position of interactive element
 * @param {Number} [options.y] - y position of interactive element
 * @param {Object[]} [options.options] - options for interaction
 * @param {Boolean} [options.options[].close] - whether to close interactive element when option chosen, defaults to true
 * @param {String} options.options[].text - option text
 * @param {Function} options.options[].callback - option click handler
 */
export function newInteractive(text, {x, y, options = []} = {}) {
    new ElementCreator('div')
        .class('interactive')
        // text container
        .newChild('div')
            .text(text)
        .newChild('div')
            .class('buttons')
            .exec((_, o) => {
                for (let i = 0; i < options.length; i++) {
                    const e = options[i];
                    o.newChild('button')
                        .text(e.text)
                        .addEventListener('onclick', ev => {
                            if(e.close === undefined || e.close === true) ev.currentTarget.parentElement.remove();
                            e.callback(ev);
                        })
                        .end
                    
                }
            })
            .end
        .appendTo(document.getElementById('menu'), true)
}