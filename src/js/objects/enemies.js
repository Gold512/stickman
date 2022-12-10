import { Enemy } from "../objects.js";

// single shot only stats: 1,1

/**
 * 
 * @param {[number, number]} position 
 * @param {keyof enemies} type 
 * @returns 
 */
export function createMagician(position, type) {
    const stats = enemies[type];
    if (!stats) throw new Error("Invalid enemy type: " + type);

    return new Enemy(position, [0.5,0.5], stats);
}

export const enemies = {
    beginner: {
        color: 'magenta',
        maxHealth: 100,
        healthRegen: .2,
        maxMana: 25,
        manaRegen: 2,
        mpl: 1,
        skills: ['single_shot'],
        ai: {
            dodge: 'none'
        }
    },
    rookie: {
        color: 'lime',
        maxHealth: 100,
        healthRegen: .2,
        maxMana: 75,
        manaRegen: 6,
        mpl: 2,
        skills: ['single_shot', 'double_shot', 'shield', 'levitation'],
        ai: {
            dodge: 'none'
        }
    },
    intermediate: {
        color: 'yellow',
        maxHealth: 100,
        healthRegen: .2,
        maxMana: 200,
        manaRegen: 15,
        mpl: 3,
        skills: ['single_shot', 'double_shot', 'triple_shot', 'shield', 'levitation'],
        ai: {
            dodge: 'low'
        }
    },
    expert: {
        color: 'red',
        maxHealth: 100,
        healthRegen: .2,
        maxMana: 320,
        manaRegen: 24,
        mpl: 4,
        skills: ['single_shot', 'double_shot', 'triple_shot', 'shield', 'flight'],
        ai: {
            dodge: 'low'
        }
    },
    master: {
        color: 'blue',
        maxHealth: 100,
        healthRegen: .2,
        maxMana: 480,
        manaRegen: 32,
        mpl: 5,
        skills: ['single_shot', 'double_shot', 'triple_shot', 'shield', 'flight', 'recursive_shot', 'shield_shot', 'curve_shot'],
        ai: {
            dodge: 'low'
        }
    },
    legend: {
        color: 'purple',
        maxHealth: 100,
        healthRegen: .2,
        maxMana: 480,
        manaRegen: 32,
        mpl: 5,
        skills: ['single_shot', 'double_shot', 'triple_shot', 'shield', 'flight', 'recursive_shot', 'shield_shot', 'curve_shot', 'penta_shot', 'super_speed'],
        ai: {
            dodge: 'low'
        }
    }
}