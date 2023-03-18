import { executeCommand } from "./cmd";

// start the tutorial
export function init() {
    executeCommand(`
storage set ttrl summon Character{"health":Infinity}
for $ttrl say "Hi"
`)
}