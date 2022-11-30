import { Enemy } from "../objects";

// single shot only stats: 1,1
export class BeginnerMagician extends Enemy {
    constructor() {

    }
}

// +tri-shot, shield, levitation, stats: 2,2
export class RookieMagician extends Enemy {
    constructor() {

    }
}

export class IntermediateMagician extends Enemy {
    constructor() {

    }
}

export const enemies = {
    beginner: {
        maxHealth: 100,
        maxMana: 25,
        healthRegen: .2,
        manaRegen: 2,
        mpl: 1,
        ai: {

        }
    }
}