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
 * @param {Boolean} [options.options[].onClose] - called when interactive UI is closed
 * @param {String} options.options[].text - option text
 * @param {Function} options.options[].callback - option click handler
 */
export function newInteractive(text, {x, y, options = [], onClose = null} = {}) {
    const container = document.getElementById('menu');

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
                
                for (let i = 0; i < options.length; i++) {
                    const e = options[i];
                    o.newChild('button')
                        .text(e.text)
                        .addEventListener('click', ev => {
                            if(e.close === undefined || e.close === true) close();
                            e.callback(ev);
                        })
                        .end
                    
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