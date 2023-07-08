import { ElementCreator } from "../classes/element_creator.js";
import { camera, speed } from '../module/calc.js';
import { collision } from "../module/collision.js";
import { Vector } from '../module/vector.js';
import * as objects from '../objects/objects.js'

let client;
let shiftLock = false;
let initialised = false;

export function toggleInspect(state=true) {
    if(!state) {
        if(dev._data.inspect) {
            const o = dev._data.inspect;
            o.inspectOverlay.remove();
            clearInterval(o.intervalID);
        }
        
        return;
    }

    const inspectOverlay = new ElementCreator('div')
        .style({
            position: 'fixed',
            left: '0',
            top: '0',
            zIndex: '9999',
            width: `${camera.scale}px`,
            height: `${camera.scale}px`,
            background: 'rgb(200 0 0 / 30%)',
            pointerEvents: 'none'
        })
        .newChild('pre')
            .style({
                position: 'absolute',
                top: '-20%',
                left: '25%',
                transform: 'translateY(-100%)',
                background: 'lightgray',
                border: '1px solid black',
                padding: '6px 3px',
                pointerEvents: 'all'
            })
            .end

        .appendTo(document.body);

    let txt = inspectOverlay.querySelector('pre');
    let mousePos = [], frozen = false, lastPos = [];
    const MAX_DOUBLE_CLICK_INTERVAL = 200;

    function positionOverlay(position) {
        if(client) {
            inspectOverlay.style.transform = `translate(${client.position[0] * camera.scale + camera.offset[0]}px,${client.position[1] * camera.scale + camera.offset[1]}px)`;
            return;
        }
        inspectOverlay.style.transform = `translate(${Math.floor(position[0]) * camera.scale + camera.offset[0]}px, ${Math.floor(position[1]) * camera.scale + camera.offset[1]}px)`
    }

    // freeze lock 
    let hasShifted = false;
    document.addEventListener('keyup', event => {
        if(event.key !== 'Shift') return;

        hasShifted = true;
        setTimeout(() => { hasShifted = false; }, MAX_DOUBLE_CLICK_INTERVAL);
    });

    document.addEventListener('keydown', event => {
        if(event.key !== 'Shift') return;
        if(event.repeat) return;

        // if shiftlock is on a single shift will disable it 
        if(shiftLock) {
            shiftLock = false;
            
            exitEditMode(inspectOverlay);

            

            inspectOverlay.style.width = camera.scale + 'px';
            inspectOverlay.style.height = camera.scale + 'px';
            return;
        }

        if(hasShifted) {
            lastPos = camera.getTile(mousePos[0], mousePos[1]);
            shiftLock = true;
        }
    })

    document.addEventListener('mousemove', ev => {
        frozen = shiftLock || ev.getModifierState('Shift');
        if(frozen) return;

        mousePos = [ev.clientX, ev.clientY];
        const pos = camera.getTile(mousePos[0], mousePos[1]);
        positionOverlay(pos);
    });

    // Shift click
    document.addEventListener('click', event => {
        if(!event.getModifierState('Shift')) return;
        const pos = camera.getTile(event.clientX, event.clientY);
        let idx = grid._GetCellIndex([Math.floor(pos[0]), Math.floor(pos[1])]);
        let cell = grid._cells[idx[0]][idx[1]];
        
        if(!cell || !cell.client) return;

        client = getClientAtPoint(pos[0], pos[1], cell);
        if(client === null) return;
        window.$s = client;

        // setup editor variables

        shiftLock = true;
        // positionOverlay(client.position);
        inspectOverlay.transform = `transform(${client.position[0] * camera.scale + camera.offset[0]}px,${client.position[1] * camera.scale + camera.offset[1]}px)`
        let size = Vector.multiply(client.dimensions, camera.scale);
        inspectOverlay.style.width = size[0] + 'px';
        inspectOverlay.style.height = size[1] + 'px';
        inspectOverlay.querySelector('pre').style.display = 'none';
        let originalDimensions;

        /**
         * 
         * @param {number} n the number to convert in tiles
         * @param {number} index 0 - x, 1 - y (the equavalant index of a positional array)
         * @returns 
         */
        function convertToPixels(n, index = 0) {
            return n * camera.scale + camera.offset[index]
        }

        function round(n) {
            return Math.round(n * 5) / 5;
        }

        let dragEvent = {
            left: ev => {
                ev.stopImmediatePropagation()
                const x = (ev.clientX - camera.offset[0]) / camera.scale;
                const dx = round(originalDimensions.left - x);
                const width = originalDimensions.width + dx;

                inspectOverlay.style.transform = `translate(${convertToPixels(x, 0)}px, ${convertToPixels(originalDimensions.top,1)}px)`
                inspectOverlay.style.width = (width * camera.scale) + 'px';

                client.dimensions[0] = width;
                client.position[0] = originalDimensions.left - dx;

                editor.top.dataset.value = width.toFixed(2);
            },
            right: ev => {
                ev.stopImmediatePropagation()
                const x = (ev.clientX - camera.offset[0]) / camera.scale;
                const dx = round(originalDimensions.left + originalDimensions.width - x);
                const width = originalDimensions.width - dx;

                inspectOverlay.style.width = (width * camera.scale) + 'px';

                client.dimensions[0] = width;
                editor.top.dataset.value = width.toFixed(2);
            },
            top: ev => {
                ev.stopImmediatePropagation()
                const y = (ev.clientY - camera.offset[1]) / camera.scale;
                const dy = round(originalDimensions.top - y);
                const height = originalDimensions.height + dy;

                inspectOverlay.style.transform = `translate(${convertToPixels(originalDimensions.left, 0)}, ${convertToPixels(y, 1)})`;
                inspectOverlay.style.height = (height * camera.scale) + 'px';

                client.dimensions[1] = height;
                client.position[1] = originalDimensions.top - dy;
                editor.left.dataset.value = height.toFixed(2);
            },
            bottom: ev => {
                ev.stopImmediatePropagation()
                const y = (ev.clientY - camera.offset[1]) / camera.scale;
                const dy = round(originalDimensions.top + originalDimensions.height - y);
                const height = originalDimensions.height - dy;

                inspectOverlay.style.height = (height * camera.scale) + 'px';
                
                client.dimensions[1] = height;
                editor.left.dataset.value = height.toFixed(2);
            },
            move: ev => {
                const x = (ev.clientX - camera.offset[0]) / camera.scale;
                const y = (ev.clientY - camera.offset[1]) / camera.scale;

                const dx = originalDimensions.posX - player.position[0] + (originalDimensions.clickX - ev.clientX) / camera.scale;
                const dy = originalDimensions.posY - player.position[1] + (originalDimensions.clickY - ev.clientY) / camera.scale;

                inspectOverlay.style.transform = `translate(${convertToPixels(x, 0)}, ${convertToPixels(y, 1)})`;

                client.position[0] = originalDimensions.left - round(dx);
                client.position[1] = originalDimensions.top - round(dy);
            }
        }
        
        /**
         * 
         * @param {MouseEvent} event 
         * @param {('up'|'down'|'left'|'right')} direction 
         */
        function dragStart(event, direction) {
            event.preventDefault();

            let clickX = event.clientX;
            let clickY = event.clientY;

            originalDimensions = {
                left: client.position[0],
                top: client.position[1],
                width: client.dimensions[0],
                height: client.dimensions[1],
                clickX, clickY,
                posX: player.position[0],
                posY: player.position[1]
            }

            document.addEventListener('mousemove', dragEvent[direction]);
            document.addEventListener('mouseup', () => { dragEnd(direction) });
        }

        function dragEnd(direction) {
            document.removeEventListener('mousemove', dragEvent[direction]);
            document.removeEventListener('mouseup', dragEnd);

            editor.left.removeAttribute('data-value');
            editor.top.removeAttribute('data-value');

            if(!client) return;
            grid.UpdateClient(client);
        }

        let editor = openObjectEditor(dragStart, inspectOverlay);
    })

    const updateInterval = 10;
    let intervalCount = 0;

    let intervalID = setInterval(() => {
        if(frozen || (mousePos[0] === undefined)) {
            // update 4x as frequently as repositioning is cheap
            positionOverlay(lastPos);
            setTimeout(positionOverlay, 25, lastPos);
            setTimeout(positionOverlay, 50, lastPos);
            setTimeout(positionOverlay, 75, lastPos);
            return;
        }

        const pos = camera.getTile(mousePos[0], mousePos[1]);
        positionOverlay(pos)
        let idx = grid._GetCellIndex([Math.floor(pos[0]), Math.floor(pos[1])]);
        let cell = grid._cells[idx[0]][idx[1]];

        intervalCount++;
        if(intervalCount !== updateInterval) return; 
        intervalCount = 0;

        let text = `[${pos[0].toFixed(3)}, ${pos[1].toFixed(3)}] (cell: ${idx[0]}, ${idx[1]})\n`;
        txt.innerText = '';
        if(!cell || !cell.client) {
            txt.innerText = text;
            return;
        }

        const sectionEnd = '\n------\n';
        while(cell?.client) {
            let client = cell.client;

            let line = `${client.constructor.name}\n`
            if(client.id) line += ` - ID: ${client.id}\n`;
            if(client.dimensions) line += ` - Size: [${client.dimensions[0].toFixed(3)}, ${client.dimensions[1].toFixed(3)}]\n`;
            if(client.health) line += ` - Health: ${client.health}\n`;
            if(client.mana) line += ` - Mana: ${client.mana}\n`;

            text += `${line}${sectionEnd}`;
            cell = cell.next;
        }
        text = text.slice(0, -sectionEnd.length);
        if(shiftLock) text += '[Shift Lock Enabled]';
        txt.innerText = text;
        
    }, 10);

    dev._data.inspect = {
        intervalID, 
        inspectOverlay
    }
}

function exitEditMode(inspectOverlay) {
    let objectEditor = document.getElementById('object.editor');
    if (objectEditor) {
        // disable object edit mode
        objectEditor.remove();
        client = null;
        inspectOverlay.querySelector('pre').style.display = 'block';
        inspectOverlay.style.pointerEvents = 'none';

    }
}

function openObjectEditor(dragStart, inspectOverlay) {
    if(!initialised) {
        ElementCreator.style({
        '.dev-tool-resize:hover': {
            'background-color': 'rgb(60, 60, 200, .5)'
        },
        '.dev-tool-resize': {
            'background-color': 'rgb(0,0,0,0)',
            'position': 'absolute',
            'transition': 'background-color 200ms linear',
            'border-radius': '3px'
        },
        
        '.dev-tool-resize[data-value]::before': {
            'position': 'absolute',
            'content': 'attr(data-value)',
            'border': '1px solid #898989',
            'padding': '0 .5em',
            'border-radius': '5px',
            'background': 'rgb(0, 0, 0, .4)',
            'color': 'white'
        },
        '.dev-tool-resize#top[data-value]::before': {
            'translate': '-50% -100%',
            'left': '50%'
        },
        '.dev-tool-resize#left[data-value]::before': {
            'translate': '-100% -50%',
            'top': '50%'
        },
        '#dev-tool-inspect-btns > div': {
            'background': 'white',
            'border': '3px solid black',
            'border-radius': '.25em',
            'padding-left': '2px',
            'margin-bottom': '3px'
        }
    });

    initialised = true }


    // resize and reposition tools 
    let element = new ElementCreator('div').id('object.editor')
        .style({
            position: 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            cursor: 'move',
            
        })
        .addEventListener('mousedown', ev => { dragStart(ev, 'move'); })
        .newChild('div').id('left')
            .class('dev-tool-resize')
            .style({
                height: '100%',
                width: '8px',
                left: '0',
                top: '0',
                translate: '-50% 0',
                cursor: 'col-resize'
            })
            .addEventListener('mousedown', ev => { dragStart(ev, 'left'); })
            .end
        .newChild('div').id('right')
            .class('dev-tool-resize')
            .style({
                height: '100%',
                width: '8px',
                top: '0',
                right: '0',
                translate: '50% 0',
                cursor: 'col-resize'
            })
            .addEventListener('mousedown', ev => { dragStart(ev, 'right'); })
            .end
        
        .newChild('div').id('top')
            .class('dev-tool-resize')
            .style({
                width: '100%',
                height: '8px',
                top: '0',
                left: '0',
                translate: '0 -50%',
                cursor: 'row-resize'
            })
            .addEventListener('mousedown', ev => { dragStart(ev, 'top'); })
            .end
        
        .newChild('div').id('bottom')
            .class('dev-tool-resize')
            .style({
                width: '100%',
                height: '8px',
                bottom: '0',
                left: '0',
                translate: '0 50%',
                cursor: 'row-resize'
            })
            .addEventListener('mousedown', ev => { dragStart(ev, 'bottom'); })
            .end

        .newChild('div').id('dev-tool-inspect-btns')
            .style({
                right: '0px',
                translate: 'calc(100% + 6px) 0',
                position: 'absolute',
                padding: '2px 3px',
                cursor: 'pointer'
            })
            .newChild('div')
                .text('delete')
                .addEventListener('click', ev => {
                    // delete 
                    shiftLock = false;
                    client.grid.Remove(client);
                    exitEditMode(inspectOverlay);
                    inspectOverlay.style.width = camera.scale + 'px';
                    inspectOverlay.style.height = camera.scale + 'px';

                })
                .end
            .newChild('div')
                .text('duplicate')
                .addEventListener('click', ev => {
                    let json = structuredClone(client.toJSON());
                    const newObject = objects[json.constructor].from(json);
                    grid.InsertClient(newObject);
                })
                .end
            .end
    .appendTo(inspectOverlay);

    inspectOverlay.style.pointerEvents = '';

    return {
        top: element.querySelector('#top'),
        bottom: element.querySelector('#bottom'),
        left: element.querySelector('#left'),
        right: element.querySelector('#right')
    }
}

// new inspect 

/**
 * Get the top-most client at a point
 */
function getClientAtPoint(x, y, cell) {
    // let tilePos = [
    //     (x - camera.offset) / camera.scale,
    //     (y - camera.offset) / camera.scale 
    // ];

    while(cell?.client) {
        let e = cell.client;

        if(collision.Rects(e.position[0], e.position[1], e.dimensions[0], e.dimensions[1], x - .1, y - .1, .2, .2)) return e;
        
        cell = cell.next;
    }

    return null;
}