import { ElementCreator } from "../classes/element_creator.js";
import { saveToStorage } from "../save.js";
import { skills } from "../skill.js";
import { newSVG } from "../module/svg.js";
import { keyRegistry, EQUIPPED_SKILLS, RESERVED_HOTKEYS, createSkillIcon, loadSkillBar } from "../ui.js";

export function characterPage() {
    return new ElementCreator('div')
        .id('character-menu')
        .class('page')
        .newChild('div')
            .class('stickfigure-icon')
            .id('stat-menu-btn')
            .appendChild(newSVG('./src/svg/stick_figure.svg'))
            .end
        
        .newChild('div')
            .class(['box','solid','handdrawn-border'])
            .id('player-box')
            .text(' MPL: ')
            .newChild('span')
                .id('player-mpl')
                .text('1')
                .end
            .newChild('br')
                .end
            .text(' Level: ')
            .newChild('span')
                .id('player-level')
                .end
            .newChild('br')
                .end
            .text(' Xp: ')
            .newChild('span')
                .id('player-xp')
                .end
            .end
        .newChild('div')
            .class(['box','solid','handdrawn-border'])
            .id('mana-box')
            .newChild('div')
                .class(['box-header','center'])
                .text('Mana')
                .end
            .text(' Max: ')
            .newChild('span')
                .id('max-mana')
                .end
            .newChild('br')
                .end
            .text(' Regen: ')
            .newChild('span')
                .id('mana-regen')
                .end
            .newChild('span')
                .class('unit')
                .text('/sec')
                .end
            .end
        .newChild('div')
            .class(['box','solid','handdrawn-border'])
            .id('health-box')
            .newChild('div')
                .class(['box-header','center'])
                .text('Health')
                .end
            .text(' Max: ')
            .newChild('span')
                .id('max-health')
                .end
            .newChild('br')
                .end
            .text(' Regen: ')
            .newChild('span')
                .id('health-regen')
                .end
            .newChild('span')
                .class('unit')
                .text('/sec')
                .end
            .end
        .newChild('div')
            .class(['box','auto-height'])
            .id('skill-box')
            .newChild('div')
                .id('skill-drop')
                .class(['row','header'])
                .addEventListener('drop', addNewSkill)
                .addEventListener('dragover', addNewSkillDragOver)
                .addEventListener('dragenter', addNewSkillDragEnter)
                .addEventListener('dragleave', addNewSkillDragLeave)

                .newChild('span')
                    .class('skill')
                    .id('plus')
                    .newChild('object')
                        .attribute('data', './src/svg/icons/plus.svg')
                        .attribute('type', 'image/svg+xml')
                        .end
                    .end
                .end
            .newChild('div')
                .id('skill-select')
                .class(['row','content'])
                .end
            .end
}

function addNewSkill(ev) {
    ev.preventDefault();
    ev.currentTarget.querySelector('#plus').style.display = '';

    const dragged = document.getElementById(ev.dataTransfer.getData("text"));
    const dropped = ev.target.matches('.card') ? ev.target : 
    ev.target.parentElement.matches('.card') ? ev.target.parentElement : ev.currentTarget.querySelector('#plus');
    const id = `skill-equipped-${dragged.dataset.id}`;
    
    let oldInsertionElement = document.querySelector('.card.insert-here');
    if(oldInsertionElement) oldInsertionElement.classList.remove('insert-here');

    let alreadyEquippedSkill = document.getElementById(id);
    if (alreadyEquippedSkill) {
        // red glow effect on the already selected skill
        alreadyEquippedSkill.classList.add('box-glow');
        setTimeout(() => { alreadyEquippedSkill.classList.remove('box-glow') }, 500)
        return;
    }

    if (dragged == null) {
        alert("That's not a skill!");
        return;
    }

    let card = createSkillCard(dragged, id);

    ev.currentTarget.insertBefore(card, dropped);
    
    EQUIPPED_SKILLS.add(dragged.dataset.id);
    loadSkillBar();
}

function addNewSkillDragOver(ev) {
    ev.preventDefault();
    let card = ev.target.matches('.card') ? ev.target : ev.target.parentElement.matches('.card') ? ev.target.parentElement : null;
    
    let oldInsertionElement = document.querySelector('.card.insert-here');
    if(oldInsertionElement && oldInsertionElement !== card) oldInsertionElement.classList.remove('insert-here');


    if(card) {
        card.classList.add('insert-here');
    }
}

function addNewSkillDragEnter(ev) {
    ev.currentTarget.querySelector('#plus').style.display = 'inline-block';
}

function addNewSkillDragLeave(ev) {
    ev.currentTarget.querySelector('#plus').style.display = 'none';
}

function updateStats(player) {
    document.getElementById('max-mana').innerText = player.maxMana;
    document.getElementById('mana-regen').innerText = player.manaRegen;

    document.getElementById('max-health').innerText = player.maxHealth;
    document.getElementById('health-regen').innerText = player.healthRegen;

    document.getElementById('player-level').innerText = player.level;
    document.getElementById('player-xp').innerText = player.xp;
    document.getElementById('player-mpl').innerText = player.mpl;
}

function updateSave(player) {
    saveToStorage(player);
}

function createSkillCard(icon, id, currentKey = '') {
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

export function updateSkills() {
    const list = document.getElementById('skill-select');
    list.innerHTML = '';

    for(let i = 0, k = Object.keys(skills); i < k.length; i++) {
        const e = skills[k[i]];
        if(!player.skills.has(e.id)) continue;

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
        
        list.appendChild(el);
    }
}

function loadEquippedSkills() {
    const skillDrop = document.getElementById('skill-drop');
    const skillDropPlus = new ElementCreator('span')
        .class('skill')
        .id('plus')
        .newChild('object')
            .attribute('data', './src/svg/icons/plus.svg')
            .attribute('type', 'image/svg+xml')
            .end
        .appendTo(skillDrop, true);
        
    for(let id of EQUIPPED_SKILLS.values()) {
        const card = createSkillCard(createSkillIcon(skills[id]), `skill-equipped-${id}`, (keyRegistry[id] || '').toUpperCase());
        skillDrop.insertBefore(card, skillDropPlus);
    }
}

function updateSkillHotkey(id) {
    const bar = document.getElementById('skill-bar');
    bar.querySelector('.skill[data-id="' + id + '"] .skill-hotkey').innerText = keyRegistry[id];
    updateSave(playerReference);
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

let playerReference;

export function reloadCharacterPage(player) {
    playerReference = player;
    updateStats(player);
    updateSkills(player);
    loadEquippedSkills();
}