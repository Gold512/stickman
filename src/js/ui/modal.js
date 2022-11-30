import { ElementCreator } from "../classes/element_creator.js";

const modalZIndex = 100;

let currentElement; // the current modal that is open
// for now modal stacking is not allowed

/**
 * Highlight an element, darkening all sorroundings, indicating that the element should be clicked
 * @param {HTMLElement} e - element to highlight for clicking
 * @param {String} label - a text box next to the element
 * @returns {Promise} - resolves when selected element is clicked
 */
export function highlightElement(e, label) {
    function clear() {
        currentElement.remove();
        currentElement = null;
    }

    if(currentElement) clear();

    const boundingBox = e.getBoundingClientRect();
    const bg = 'rgba(0,0,0,.6)';

    // place overlay over all areas except bounds of the selected element
    currentElement = new ElementCreator('div')
        .style({
            zIndex: modalZIndex,
            pointerEvents: 'none',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%'
        })
        // top rectangle
        .newChild('div')
            .style({
                position: 'absolute',
                background: bg,
                pointerEvents: 'unset',

                top: '0',
                left: '0',
                width: '100%',
                height: boundingBox.top + 'px'

            })
            .end
        // left rectangle
        .newChild('div')
            .style({
                position: 'absolute',
                background: bg,
                pointerEvents: 'unset',

                top: boundingBox.top + 'px',
                left: '0',
                height: boundingBox.height + 'px',
                width: boundingBox.left + 'px'
            })
            .end
        // right rectangle
        .newChild('div')
            .style({
                position: 'absolute',
                background: bg,
                pointerEvents: 'unset',

                top: boundingBox.top + 'px',
                left: (boundingBox.left + boundingBox.width) + 'px',
                width: `calc(100% - ${boundingBox.left + boundingBox.width}px)`,
                height: boundingBox.height + 'px'
            })
            .end
        .newChild('div')
            .style({
                position: 'absolute',
                background: bg,
                pointerEvents: 'unset',
                
                top: (boundingBox.top + boundingBox.height) + 'px',
                left: '0',
                width: '100%',
                height: `calc(100% - ${(boundingBox.top + boundingBox.height)}px)`
            })
            .end
        // highlight non-darkened element
        .newChild('div')
            .style({
                position: 'absolute',
                left: boundingBox.left + 'px',
                top: boundingBox.top + 'px',
                width: boundingBox.width + 'px',
                height: boundingBox.height + 'px'
            })
            .class('flash')
            .end
        .appendTo(document.body);
    
    let resolve;
    const p = new Promise(res => {resolve = res});

    e.addEventListener('click', () => {
        clear();
        e.classList.remove('flash');
        resolve();
    });
    
    return p;
}

export function confirmation(text='') {
    function clear() {
        currentElement.remove();
        currentElement = null;
    }
    
    if(currentElement) clear();

    let resolve, reject;
    const p = new Promise((res, rej) => {resolve = res, reject = rej});

    currentElement = new ElementCreator('div')
        .class('confirmation-modal')
        .newChild('div')
            .class('confirmation-modal-text')
            .text(text)
            .end
        .newChild('div')
            .class('confirmation-modal-button-container')

            .newChild('button')
                .text('No')
                .addEventListener('click', () => {
                    reject();
                    clear();
                })
                .end

            .newChild('button')
                .text('Yes')
                .addEventListener('click', () => {
                    resolve();
                    clear();
                })
                .end
            .end
        .appendTo(document.body);
    
    return p;
}