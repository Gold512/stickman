/**
 * @typedef {Object} AnimationObject
 * @property {function} stop - forcefully stop the animation
 * @property {Promise} promise - a promise that resolves when the animation is finished or stopped
 */

/**
 * Basic animation constructor
 * @param {function(Number): void} step - callback with the first param being a number from 0 to 1 indicating the progress of the animation
 * @param {Number} duration 
 * @returns {AnimationPromise} 
 */
export function CreateAnimation(step, duration) {
    if(duration <= 0) throw new Error('invalid animation duration')
    let resolve;
    const p = new Promise(res => {resolve = res});

    let startTime = performance.now();
    const id = requestAnimationFrame(function frame(t) {
        const timeElapsed = t-startTime;
        const progress = Math.min(1, timeElapsed / duration)
        step(progress);
        if(progress < 1) {
            requestAnimationFrame(frame);
        } else {
            resolve();
        }
    });

    // function to stop the animation;
    return {
        stop() {
            cancelAnimationFrame(id);
            resolve();
            step(1); // instantly go to last frame of animation
        },
        promise: p
    }
}