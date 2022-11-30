// Joystick for mobile devices 

import { ElementCreator } from "../classes/element_creator.js";
import { keyState } from "../main.js";
import { newSVG } from "../module/svg.js";

function touchStart(e) {
    keyState[e.currentTarget.dataset.direction] = true;
    console.log(e.currentTarget.dataset.direction)
}

function touchEnd(e) {
    keyState[e.currentTarget.dataset.direction] = false;
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