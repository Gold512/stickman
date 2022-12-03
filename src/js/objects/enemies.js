import { Enemy } from "../objects.js";

// single shot only stats: 1,1
export function summonMagician(grid, position, type) {
    const stats = enemies[type];
    if (!stats) throw new Error("Invalid enemy type: " + type);

    console.log(grid.InsertClient(new Enemy(position, [0.5,0.5], stats)).id);
}

export const enemies = {
    beginner: {
        color: 'magenta',
        maxHealth: 100,
        maxMana: 25,
        healthRegen: .2,
        manaRegen: 2,
        mpl: 1,
        skills: ['single_shot'],
        ai: {
            dodge: 'low'
        }
    }
}