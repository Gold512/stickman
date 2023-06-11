// Joystick for mobile devices 

import { ElementCreator } from "../classes/element_creator.js";
import { keyState } from "../main.js";
import { newSVG } from "../module/svg.js";

function touchStart(e) {
    e.preventDefault();
    const direction = e.currentTarget.dataset.direction;
    prevDirection = direction;
    keyState[direction] = true;
}

function touchEnd(e) {
    e.preventDefault();
    const direction = e.currentTarget.dataset.direction;
    prevDirection = direction;
    keyState[direction] = false;
}

const MIN_TOUCH_MOVE_INTERVAL = 50;
let touchMoved = false;
let prevDirection;

/**
 * 
 * @param {TouchEvent} ev 
 * @returns 
 */
function touchMove(ev) {
    if(touchMoved) return;
    touchMoved = true;

    const element = document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY);
    if(element) {
        keyState[prevDirection] = false;

        const direction = element.dataset.direction;
        prevDirection = direction;
        keyState[prevDirection] = true;
    }

    setTimeout(() => { touchMoved = false }, MIN_TOUCH_MOVE_INTERVAL)
}

// Add event listener to canvas
export function init() {
    document.addEventListener('touchstart', function onFirstTouch() {
        // create touch controls
        new ElementCreator('div').id('movement-buttons')
            .newChild('button')
                .class('overlay')
                .appendChild(newSVG('./src/svg/icons/left_arrow.svg'))
                .dataset('direction', 'left')
                .addEventListener('touchstart', touchStart)
                .addEventListener('touchend', touchEnd)
                .end
            
            .newChild('button')
                .class('overlay')
                .style({transform: 'translateY(-100%)'})
                .appendChild(newSVG('./src/svg/icons/up_arrow.svg'))
                .dataset('direction', 'up')
                .addEventListener('touchstart', touchStart)
                .addEventListener('touchend', touchEnd)
                .end

            .newChild('button')
                .class('overlay')
                .appendChild(newSVG('./src/svg/icons/right_arrow.svg'))
                .dataset('direction', 'right')
                .addEventListener('touchstart', touchStart)
                .addEventListener('touchend', touchEnd)
                .end
            .addEventListener('touchmove', touchMove)
        .appendTo(document.body);
            

        document.removeEventListener('touchstart', onFirstTouch);

        document.addEventListener('keydown', function hide() {
            document.getElementById('movement-buttons').style.display = 'none'
        });
        
        document.addEventListener('touchstart', function show() {
            document.getElementById('movement-buttons').style.display = ''
        });
    });
}

export function changeMovementMode(mode) {
    let container = document.getElementById('movement-buttons');
    if(!container) return;

    
}