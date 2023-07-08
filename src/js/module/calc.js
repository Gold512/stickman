// store important global constants and functions 

import { skills } from "../skill.js";

export function getOrbStats(mpl) {
    return {
        dmg: Math.round((mpl + 2)**(1.8) * .5),
        size: Math.round(( (2 ** (mpl - 1)) / Math.PI) ** (1/2.75) * 50) / 100
    }
}

export const speed = {
    projectile: 15,
    move: 7,
    levitation: 4
}

export const camera = {
    /** tiles * scale = pixels, pixels / scale = tiles */
    scale: 50,
    offset: [window.innerWidth / 2, window.innerHeight / 2],
    
    /**
     * Get the tile position from pixels in camera
     * @param {number} x 
     * @param {number} y 
     */
    getTile(x, y) {
        return [(x - this.offset[0])/this.scale, (y - this.offset[1])/this.scale]
    }
};

const toCamelCase = s => s.toLowerCase().replace(/[-_][a-z]/g, (group) => group.slice(-1).toUpperCase());

export let skillConversionTable;
setTimeout(() => {
    let res = {};
    for(let i in skills) {
        let camelcase=toCamelCase(i);
        res[i] = camelcase;
        res[camelcase] = i;
    }
    skillConversionTable = res;
},0);