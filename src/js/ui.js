import { downloadSave, loadSaveFile, saveToStorage } from "./save.js";
import { mpl_colors, skills } from "./skill.js";
import {newSVG} from "./module/svg.js";
import { stat_menu } from "./ui/skill_tree.js";

const display = {
    menu: 'block'
}

function toggleStatMenu() {
    const menu = document.getElementById('stat-menu');

    if(menu.style.display != 'none') {
        menu.style.display = 'none';
    } else {
        menu.style.display = display.menu;
    }

    updateStats(ref.player);
    updateSkills(ref.player);
}

let ref = {};
export function initUI(player) {
    document.getElementById('stats').addEventListener('click', toggleStatMenu);
    document.querySelector('#stat-menu #close').addEventListener('click', toggleStatMenu);

    document.getElementById('download-save').addEventListener('click', () => downloadSave(player));
    document.getElementById('load-save').addEventListener('click', () => loadSaveFile(player));
    
    ref.player = player;

    // drag and drop
    const addSkill = document.querySelector('.skill#plus');
    addSkill.addEventListener('drop', ev => {
        ev.preventDefault();

        const dragged = document.getElementById(ev.dataTransfer.getData("text"));
        const dropped = ev.currentTarget;
        const id = `skill-equipped-${dragged.dataset.id}`;
        if(document.getElementById(id)) return;

        if(dragged == null) {
            alert("That's not a skill!");
            return;
        }

        let card = createSkillCard(dragged, id);

        ev.currentTarget.parentElement.insertBefore(card, dropped);
        EQUIPPED_SKILLS.add(dragged.dataset.id);
        loadSkillBar();
    });

    addSkill.addEventListener('dragover', ev => ev.preventDefault());

    stat_menu.init();
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

function updateStats(player) {
    document.getElementById('max-mana').innerText = player.maxMana;
    document.getElementById('mana-regen').innerText = player.manaRegen;

    document.getElementById('max-health').innerText = player.maxHealth;
    document.getElementById('health-regen').innerText = player.healthRegen;

    document.getElementById('player-level').innerText = player.level;
    document.getElementById('player-xp').innerText = player.xp;
}

// update the localStorage save data
function updateSave() {
    saveToStorage(ref.player);
}

export function updateSkills() {
    const list = document.getElementById('skill-select');
    list.innerHTML = '';

    for(let i = 0, k = Object.keys(skills); i < k.length; i++) {
        const e = skills[k[i]];
        if(!player.skills.has(e.id)) continue;

        // const el = document.createElement('div');
        //     el.draggable = 'true';
        //     el.classList.add('skill');
        //     el.dataset.id = e.id;
        //     el.id = `skill-${e.id}`;

        let el = createSkillIcon(skills[e.id]);
            el.draggable = 'true'; 
            el.dataset.id = e.id;
            el.id = `skill-${e.id}`;

            // handle tooltip on drag
            el.addEventListener('mousedown', ev => ev.target.classList.add('dragged') );
        
            el.addEventListener('dragend', ev => {
                setTimeout(() => ev.target.classList.remove('dragged'), 500);
            });

            el.addEventListener('dragstart', ev => {
                ev.dataTransfer.setData("text", ev.target.id);
            });

            // const svg = document.createElement('svg');
            //     svg.setAttribute('viewBox', '0 0 400 400');

            // const image = document.createElement('image');
            //     image.setAttribute('xlink:href', `./src/svg/attack/${e.id}.svg`);
            //     image.setAttribute('width', '400');
            //     image.setAttribute('height', '400');
            //     svg.appendChild(image);

            // el.appendChild(svg);
            
            // el.appendChild(createSkillIcon(skills[e.id]));
        
        list.appendChild(el);
    }
}

export function loadEquippedSKills() {
    const skillDrop = document.getElementById('skill-drop');
    const skillDropPlus = skillDrop.querySelector('#plus')
    for(let id of EQUIPPED_SKILLS.values()) {
        const card = createSkillCard(createSkillIcon(skills[id]), `skill-equipped-${id}`, keyRegistry[id].toUpperCase());
        skillDrop.insertBefore(card, skillDropPlus);
    }
}

function updateSkillHotkey(id) {
    const bar = document.getElementById('skill-bar');
    bar.querySelector('.skill[data-id="' + id + '"] .skill-hotkey').innerText = keyRegistry[id];
    updateSave();
}

export const keyRegistry = {

}

export const EQUIPPED_SKILLS = new Set();

const RESERVED_HOTKEYS = [
    'w', 'a', 's', 'd'
]

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

function createSkillIcon(skill) {
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

function newHotkeyInput() { 
    const e = document.createElement('input');
    e.classList.add('hotkey-input');
    e.addEventListener('keypress', ev => {
        ev.preventDefault();
        const el = ev.currentTarget;
        if(!ev.key) return;

        // Key already assigned 
        if(keyRegistry[ev.key] != undefined || RESERVED_HOTKEYS.includes(ev.key)) {
            el.style.outline = 'red 2px dashed';

            if(el.dataset.animid != undefined) clearTimeout(Number(el.dataset.animid));

            el.dataset.animid = setTimeout(() => {
                el.style.outline = '';
                el.dataset.animid = '';
            }, 200);
            return;
        }

        el.value = ev.key.toUpperCase();
        let id = el.parentElement.querySelector('.skill').dataset.id;

        // Remove old hotkey registry entry
        delete keyRegistry[keyRegistry[id]];

        keyRegistry[ev.key] = id;
        keyRegistry[id] = ev.key;
        updateSkillHotkey(id);
    });
    return e;
}
