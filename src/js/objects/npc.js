import { Client } from "../spacial_hash.js";
import { newInteractive } from "../ui/interaction.js";
class NPC extends Client {
    constructor(position, dimensions) {
        super(position, dimensions);
        

    }

    Interaction(ev) {
        newInteractive(this.name, {
            x: ev.client[0],
            y: ev.client[1],
            
        })
    }
}