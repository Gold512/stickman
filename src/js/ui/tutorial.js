import { ElementCreator } from "../classes/element_creator";

const ID = 'highlight-overlay'

function highlightElement(e) {
    const boundingBox = e.getBoundingClientRect();
    const bg = 'rgba(0,0,0,.5)';

    // place overlay over all areas except bounds of the selected element
    new ElementCreator('div').id(ID)
        .style({
            zIndex: 100,
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
                
                top: (boundingBox.top + boundingBox.height) + 'px',
                left: '0',
                width: '100%',
                height: `calc(100% - ${(boundingBox.top + boundingBox.height)}px)`
            })
}