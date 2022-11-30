// store important global constants and functions 

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
    scale: 50,
    offset: [window.innerWidth / 2, window.innerHeight / 2]
};