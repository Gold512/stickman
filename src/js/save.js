import {LZString} from "./libs/lzstring.js";

function getSaveJSON(player) {
    return JSON.stringify({
        stats: player.stats,
        skills: [...player.skills]
    });
}

/**
 * Download a blob or string as a file
 * @param {Blob|String} blob blob to download (strings will be auto converted)
 * @param {String} filename name of file to download 
 */
function saveFile(blob, filename) {
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
}

export function saveToStorage(player) {
    const JSONStr = getSaveJSON(player);
    window.localStorage.setItem('save', JSONStr);
}

export function loadFromStorage(player) {
    let data = window.localStorage.getItem('save');
    if(!data) return;

    data = JSON.parse(data);
    load(data, player);
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