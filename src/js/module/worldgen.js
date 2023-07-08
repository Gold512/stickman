import { RectSolid, SlopeSolid } from "../objects/solid.js";
import { math } from "./math.js";

const TILE_TABLE = [
    {
        weight: 3,
        item: 1
    },
    {
        weight: 1,
        item: 2
    },
    {
        weight: 1,
        item: 0.5
    },
    {
        weight: 1,
        item: 0.25
    },
    {
        weight: 1,
        item: 1.25
    },
    {
        weight: 1,
        item: 0.75
    },
    {
        weight: 2,
        item: 1.5
    }
];

/**
 * 
 * @param {number} width 
 * @param {import("./vector.js").Vector2D} origin the origin of the world, there will always be flat ground on that location 
 * @returns {import('../spacial_hash.js').Client[]} clients generated
 */
export function generateWorld(width, origin, offsetX = 0, offsetY = 0) {
    let clients = [];
    let height = origin[1] + offsetY;

    let lastRand = 0;

    for(let i = origin[0]; i < width; i++) {
        let rand = math.weighted_random([
            {
                weight: (lastRand !== 1) ? 1 : 0,
                item: -1
            },
            {
                weight: 0.25,
                item: 0
            },
            {
                weight: (lastRand !== -1) ? 1 : 0,
                item: 1
            }
        ]);

        let change;
        if(rand !== 0) change = math.weighted_random(TILE_TABLE)
        

        switch(rand) {
            case -1:
                // go down 
                clients.push(new SlopeSolid([i + offsetX, height + offsetY], [1, change], 'right'));
                height += change;
                clients.push(new RectSolid([i + offsetX, height + offsetY], [1, 1]));

                break;
            case 0:
                lengthenBlock(i);
                break;
            case 1:
                // go up
                clients.push(new SlopeSolid([i - 1 + offsetX, height - change + offsetY], [1, change], 'left'));
                height -= change;
                clients.push(new RectSolid([i + offsetX, height + offsetY], [1, 1]));
                break;
        }

        lastRand = rand;

    }

    return clients;

    function lengthenBlock(i) {
        if (clients[clients.length - 1] instanceof RectSolid) {
            clients[clients.length - 1].dimensions[0] += 1;
        } else {
            clients.push(new RectSolid([i + offsetX, height + offsetY], [1, 1]));
        }
    }
}