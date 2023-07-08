import { ElementCreator } from "../classes/element_creator.js";
import { downloadSave, loadSaveFile } from "../save.js";

export function settingsPage() {
    return new ElementCreator('div')
        .id('settings-page')
        .newChild('div')
            .class('box')
            .text('Load Save')
            .addEventListener('click', loadSaveFile)
            .end
        .newChild('div')
            .class('box')
            .text('DOWNLOAD Save')
            .addEventListener('click', () => downloadSave(player))
            .end
        .newChild('div')
            .class('box')
            .text('FPS Counter')
            .appendChild(createCheckBox())
            .end
        .newChild('div')
            .class('box')
            .text('Health sub-bar')
            .appendChild(createCheckBox())
                .newChild('div')
                .text('Toggle health bar that shows how long before health starts getting regenerated')
                .end
            .end
        .if(window.devMode, elementCreator => {
            elementCreator.newChild('div')
                .class(['box', 'accordian'])
                    .newChild('div')
                        .text('dev settings')
                        .newChild('div')
                            .text('Time based on TPS')
                            .appendChild(createCheckBox())
                    .end
                .end
        })
}

function createCheckBox() {
    return new ElementCreator('label')
        .class('settings-checkbox')
        .newChild('input')
            .attribute('type', 'checkbox')
        .end
}