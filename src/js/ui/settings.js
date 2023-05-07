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
}

function createCheckBox() {
    return new ElementCreator('label')
        .class('settings-checkbox')
        .newChild('input')
            .attribute('type', 'checkbox')
        .end
}