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
    const container = document.getElementById('menu');

    new ElementCreator('div')
        .class('interactive')
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

                // close button
                o.newChild('button')
                    .text('Close')
                    .addEventListener('click', ev => {
                        ev.currentTarget.parentElement.parentElement.remove();
                        document.getElementById('menu').style.display = '';
                    })
                    .end
            })
            .end

        .appendTo(container, true);

    container.style.display = 'block';
}