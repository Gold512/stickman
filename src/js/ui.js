import { downloadSave, loadSaveFile, saveToStorage } from "./save.js";
import { mpl_colors, skills } from "./skill.js";
import {newSVG} from "./module/svg.js";
import { stat_menu } from "./ui/skill_tree.js";
import * as touch from "./ui/touch.js";
import { createMenu, reloadMenu } from "./ui/menu.js";

export const keyRegistry = {

}

export const EQUIPPED_SKILLS = new Set();

export const RESERVED_HOTKEYS = [
    'w', 'a', 's', 'd'
]

const display = {
    menu: null
}

function createUI() {
    createMenu().appendTo(document.body);
    stat_menu.init()
}

export function toggleStatMenu() {
    if(display.menu === null) {
        createUI();
        display.menu = true;
    } else {
        display.menu = !display.menu;
    }

    let state = display.menu;

    let fps = document.querySelector('[id^="yy-counter"]');
    if(state) {
        display.fps = fps.style.display;
        fps.style.display = 'none';
        reloadMenu(ref.player);
    } else {
        fps.style.display = display.fps;
    }

    document.querySelector('.menu-container').style.display = state ? '' : 'none';

    grid.paused = state;
}

let ref = {};
export function initUI(player) {
    ref.player = player;
    document.getElementById('stats').addEventListener('click', toggleStatMenu);
    touch.init();
}

export function createSkillCard(icon, id, currentKey = '') {
    const card = document.createElement('div');
    card.classList.add('card');
    let clone = icon.cloneNode(true);

    clone.id = id;
    clone.draggable = '';

    clone.addEventListener('click', ev => {
        const e = ev.currentTarget.parentElement;

        const id = ev.currentTarget.dataset.id;
        delete keyRegistry[keyRegistry[id]];
        delete keyRegistry[id];

        e.parentElement.removeChild(e);
        EQUIPPED_SKILLS.delete(id);
        loadSkillBar();
    });

    card.appendChild(clone);

    const hotkeyInput = newHotkeyInput(currentKey);
    if(currentKey) hotkeyInput.value = currentKey;
    card.appendChild(hotkeyInput);
    return card;
}

// update the localStorage save data
function updateSave() {
    saveToStorage(ref.player);
}

export function loadSkillBar(save = true) { 
    const bar = document.getElementById('skill-bar');
    bar.innerHTML = '';
    for(let i of EQUIPPED_SKILLS) {
        const skill = skills[i];
        let skillIcon = createSkillIcon(skill);
            const hotkey = document.createElement('div');
            hotkey.classList.add('skill-hotkey');
            hotkey.innerHTML = keyRegistry[skill.id] || '&nbsp;';
            skillIcon.appendChild(hotkey);

        bar.appendChild(skillIcon)
    }
    if(save) updateSave();
}

export function createSkillIcon(skill) {
    const e = document.createElement('span');
        e.classList.add('skill');
        e.style.setProperty('--cd', skill.cd);
        e.dataset.id = skill.id;

    e.appendChild(newSVG(`./src/svg/attack/${skill.id}.svg`));

    const statData = document.createElement('div');
        statData.classList.add('tooltip');
        statData.classList.add('skill-tooltip');
        statData.style.setProperty('--color', mpl_colors[skill.mpl]);
        
        const title = document.createElement('div');
            title.classList.add('skill-title');
            title.innerText = skill.name;
            statData.appendChild(title);

        if(skill.desc) {
            const desc = document.createElement('div');
                desc.classList.add('skill-desc');
                desc.innerText = skill.desc;
                statData.appendChild(desc);
        }

        const mana = document.createElement('div');
            mana.classList.add('mana');
            // mana and cd is converted to number to make innerHTML secure 
            // They could be strings due to a modified save file and be used
            // to inject script tags into the page
            mana.innerHTML = `<b>Mana</b>: <span class='darken' style='color: hsl(240deg 100% 74%);'>${Number(skill.mana)}</span>`;
            statData.appendChild(mana);

        const cd = document.createElement('div');
            cd.classList.add('cd');
            cd.innerHTML = `<b>CD</b>: <span class='darken' style='color:lightgreen'>${Number(skill.cd)}s</span>`;
            statData.appendChild(cd);
    
    e.appendChild(statData);

    return e;
}