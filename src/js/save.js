import {LZString} from "./libs/lzstring.js";
import {keyRegistry, EQUIPPED_SKILLS, loadSkillBar} from "./ui.js";
import * as objects from './objects/objects.js'
import { SpatialHash } from "./spacial_hash.js";

export function getSaveJSON(player) {
    if(!player.stats) return;
    const skills = Array.from(EQUIPPED_SKILLS);

    const skillKeys = {};
    for(let i = 0; i < skills.length; i++) skillKeys[skills[i]] = keyRegistry[skills[i]]; 

    return JSON.stringify({
        stats: player.stats,
        skills: [...player.skills],
        equipped_skills: skillKeys,
        grid: grid.toJSON()
    }, (key, val) => {
        if(val === undefined) return val;
        return val.toFixed ? Number(val.toFixed(3)) : val;
    });
}

/**
 * Download a blob or string as a file
 * @param {Blob|String} blob blob to download (strings will be auto converted)
 * @param {String} filename name of file to download 
 */
export function saveFile(blob, filename) {
    if(typeof blob == 'string') blob = new Blob([blob]);

	if (window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveOrOpenBlob(blob, filename);
	} else {
		const a = document.createElement('a');
		document.body.appendChild(a);
		const url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = filename;
		a.click();
		setTimeout(() => {
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		}, 0)
	}
}

function load(obj, player) {
    const stats = obj.stats;
    for(let i = 0, k = Object.keys(stats); i < k.length; i++) {
        player.stats[k[i]] = stats[k[i]];
    }

    player.UpdateStats();

    // update the skills
    player.skills = new Set(obj.skills || []);

    // update equipped skills
    const equipped = obj.equipped_skills || {};
    for(let i = 0, k = Object.keys(equipped); i < k.length; i++) {
        keyRegistry[k[i]] = equipped[k[i]];
        keyRegistry[equipped[k[i]]] = k[i];
        EQUIPPED_SKILLS.add(k[i]);
    }

    // grid = SpatialHash.from(obj.grid, objects);

    loadSkillBar(false);
    return SpatialHash.from(obj.grid, objects);
}

export function saveToStorage(player) {
    const JSONStr = getSaveJSON(player);
    window.localStorage.setItem('save', JSONStr);
}

export function loadFromStorage(player) {
    let data = window.localStorage.getItem('save');
    if(!data) return;

    data = JSON.parse(data);
    return load(data, player);
}

export function downloadSave(player) {
    const JSONStr = getSaveJSON(player);
    saveFile(LZString.compressToUTF16(JSONStr), `save-${new Date().toISOString().split('.')[0]}.dat`);
}

export function loadSaveFile(player) {
    // Ask for file
    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.addEventListener('change', ev => {
        let file = ev.currentTarget.files[0];
        if(!file) return;

        (new Blob([file])).text().then(v => {
            v = LZString.decompressFromUTF16(v);
            v = JSON.parse(v);
            load(v, player);

            // Save file data to localStorage
            saveToStorage(player);
        });
    });

    fileInput.click();
}

export function saveGrid() {
    return grid.toJSON();
}