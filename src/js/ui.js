import { downloadSave, loadSaveFile } from "./save.js";

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
}

export function initUI(player) {
    document.getElementById('stats').addEventListener('click', toggleStatMenu);
    document.querySelector('#stat-menu #close').addEventListener('click', toggleStatMenu);

    document.getElementById('download-save').addEventListener('click', () => downloadSave(player));
    document.getElementById('load-save').addEventListener('click', () => loadSaveFile(player));
}

export function updateStats(player) {
    document.getElementById('max-mana').innerText = player.maxMana;
    document.getElementById('mana-regen').innerText = player.manaRegen;

    document.getElementById('max-health').innerText = player.maxHealth;
    document.getElementById('health-regen').innerText = player.healthRegen;
}