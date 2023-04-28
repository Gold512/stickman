import { MagicProjectile, RecursiveMagicProjectile, Shield } from "./objects/objects.js";
import { Vector } from "./module/vector.js";
import { math } from "./module/math.js";
import { speed, getOrbStats } from "./module/calc.js";
function multiShot(grid, caster, vector, deg) {
    const origin = caster.GetCenter();
    for(let i = 0; i < deg.length; i++) {
        const vect = deg[i] != 0 ? Vector.rotate(vector, deg[i]) : vector;

        const stats = getOrbStats(caster.mpl)
        const x = origin[0] + vect[0] * (stats.size * .5 + Math.SQRT2 * caster.dimensions[0] * .5);
        const y = origin[1] + vect[1] * (stats.size * .5 + Math.SQRT2 * caster.dimensions[0] * .5);
        
        grid.InsertClient(new MagicProjectile([x, y], stats.size, vect, speed.projectile, {
            dmg: stats.dmg,
            color: 'black',
            owner: caster.id,
            mpl: caster.mpl
        }));
    }
}

function getFiredObjectPosition(caster, radius, vector) {
    const origin = caster.GetCenter();
    // use left and top edges of box to check which 'section' the object will be in
    const intersect_x = Vector.intersection(origin, vector, caster.position, [1, 0]),
        intersect_y = Vector.intersection(origin, vector, caster.position, [0, 1]);

    // in corner, should be quite rare though
    // intersect_x code should give a good enough approximation
    // of the position if it were in the corner
    // if(intersect_x && intersect_y) {

    //     return;
    // }
    
    if(intersect_x) {

        return;
    }

    if(intersect_y) {

        return;
    }

    
}

function alignY(projectile) {
    // check if an orb will collide with the floor and if so move it upward
    let nearBySolids = grid.ClientSelector({
        origin: projectile.position,
        bounds: [1, 1],
        type: RectSolid
    });

    
}

export const skills = {
    single_shot: {
        name: 'Single Shot',
        id: 'single_shot',
        mana: 3,
        cd: .3,
        cost: 0,
        mpl: 1,
        type: 'attack'
    },
    double_shot: {
        name: 'Double Shot',
        id: 'double_shot',
        mana: 6,
        cd: .3, 
        cost: 2,
        mpl: 2,
        type: 'attack'
    },
    triple_shot: {
        name: 'Triple Shot',
        id: 'triple_shot',
        mana: 9,
        cd: .3, 
        cost: 5,
        mpl: 2,
        type: 'attack'
    },
    curve_shot: {
        name: 'Curve Shot',
        id: 'curve_shot',
        mana: 8,
        cd: .3,
        mpl: 3,
        cost: 3,
        desc: 'using mana to change the trojectory of the projectile, an arc path can be achieved\nClick - fire\nScroll - change arc degree',

        curve: 60,
        direction: 1,
        type: 'attack'
    },
    double_curve_shot: {
        name: 'Double Curve Shot',
        id: 'double_curve_shot',
        mana: 15,
        cd: .3,
        cost: 8,
        mpl: 4,
        desc: 'by using 2 curve shots, a larger explosion can be created where aimed at',

        curve: 60,
        type: 'attack'
    },
    levitation: {
        name: 'Levitation',
        id: 'levitation',
        mana: 3,
        cd: 2,
        cost: 3,
        mpl: 2,
        type: 'movement'
    },
    flight: {
        name: 'Flight',
        id: 'flight',
        mana: 8,
        cd: 2,
        cost: 8,
        mpl: 3,
        type: 'movement'
    },
    super_speed: {
        name: 'Super Speed',
        id: 'super_speed',
        mana: 20,
        cd: 2,
        cost: 20,
        mpl: 6,
        type: 'movement'
    },
    hyperspeed: {
        name: 'Hyperspeed',
        id: 'hyperspeed',
        mana: 150,
        cd: 1,
        cost: 50,
        mpl: 8,
        type: 'movement'
    },
    shield: {
        name: 'Shield',
        desc: 'basic defensive barrier, defends against most attacks with durability scaling with MPL of caster',
        id: 'shield',
        mana: 15,
        cd: 7,
        cost: 5,
        mpl: 2,
        type: 'defense'
    },
    shield_expand: {
        name: 'Shield Expand',
        desc: 'incresse the size of the shield to block curve shots more efficently',
        id: 'shield_expand',
        mana: 3,
        cd: 0,
        cost: 8,
        mpl: 3,
        type: 'defense'
    },
    shield_shot: {
        name: 'Shield Shot',
        id: 'shield_shot',
        mana: 15,
        cd: 0 , 
        cost: 15,
        mpl: 5,
        type: 'attack'
        // Limited by shield cast time as a shield has to be created before it can be shot 
    },

    volley_shot: {
        name: 'Volley Shot',
        desc: 'An effective sphere of compressed energy that is charged for a period of time, increasingly becoming larger then quickly firing out an inaccurate barrage of usual shots that slowly shrink over time.',

        id: 'volley_shot',
        mana: 25,
        cd: .1, 
        cost: 20,
        mpl: 5,
        type: 'attack'
    },

    recursive_shot: {
        name: 'Recursive Shot',

        id: 'recursive_shot',
        mana: 12,
        cd: .75,
        cost: 10,
        mpl: 5,
        type: 'attack'
    }
}

export function skillSort(skillList) {
    let res = {};
    for(let i = 0; i < skillList.length; i++) {
        res[skillList[i].type] = skillList[i];
    }
    return res;
}

export const mpl_colors = [
    'black',
    'magenta',
    'lime',
    'yellow',
    'red',
    'blue',
    'purple',
    'gray'
]

function curveShotArc(a, b, angle) {
    // ensure that b is to the right of a
    // if(a[0] > b[0]) [a, b] = [b, a];

    // let v1 = Vector.create(360 - angle - rotation);
    // let v2 = Vector.create(180 + angle - rotation);

    let v1 = Vector.sub(b, a);
    v1 = Vector.rotate(v1, -angle);
    let v2 = Vector.sub(a, b);
    v2 = Vector.rotate(v2, angle);

    // console.log(a, v1, b, v2)

    const intersection = Vector.intersection(a, v1, b, v2);

    // const a2 = .5 * (180 - 2 * angle);
    const l = math.line_length(a, intersection);
    return {
        center: intersection,
        radius: l,
        rotationPerUnit: 1/l,
        angleA: Vector.getAngle(Vector.sub(a, intersection)),
        angleB: Vector.getAngle(Vector.sub(b, intersection)),
        vectors: [v1, v2]
    };
}

// casting functions
export const skillCaster = (function() {
    function singleShot({ grid, caster, vector } = {}) {
        multiShot(grid, caster, vector, [0]);
    }

    function doubleShot({ grid, caster, vector } = {}) {
        multiShot(grid, caster, vector, [5, -5]);
    }

    function tripleShot({ grid, caster, vector } = {}) {
        multiShot(grid, caster, vector, [8, 0, -8])
    }

    function shield({ grid, caster } = {}) {
        if(caster.shield != null || caster.shield != undefined) return false;
        const [x, y] = caster.position;
        caster.shield = grid.InsertClient(new Shield([x, y], [.25, 1], caster.id, 10));
    }

    function shieldShot({ caster, vector } = {}) {
        if(!caster.shield) return false;
        const shield = caster.shield;

        const x = caster.position[0];
        const sx = shield.position[0];

        // Prevent caster from shooting shield in the opposite direction 
        // that they are facing
        if(
            (caster.facing == 'left' && sx > x) || 
            (caster.facing == 'right' && sx < x)
        ) return; 

        shield.velocity = vector;
        shield.projectile = true;
        shield.collision.type = 'active';
        shield.damage = 3;

        caster.shield = null;
    }

    function superSpeed({ ctx, scale, offset, caster, vector, tile } = {}) {
        // require player to fly/levitate to use
        // may limit it to fly only 
        if(!caster.HasTag('NoGravity')) return false;

        // Cast will fail if remaining duration is less then 20ms or 
        // another modifier is present
        if(caster.modifier && ((caster.modifier.name == 'superSpeed' && caster.modifier.duration > 20)
        || (caster.modifier.name && caster.modifier.name != 'superSpeed'))) return false;

        const speed = 15;

        const center = caster.GetCenter()

        // calculate amount of time required to reach clicked point
        let dist = [caster.position[0] - tile[0], caster.position[1] - tile[1]];
        let time = speed * Math.sqrt(dist[0]**2 + dist[1]**2) * 5;

        const [x, y] = caster.GetCenter();
        caster.modifier = {
            name: 'superSpeed',
            duration: time,
            noMove: true,
            callback: (t) => {
                const ts = t * 0.001;
                if(caster.mana < 1) {
                    caster.modifier = {};
                    return;
                }

                caster.position[0] += speed * vector[0] * ts;
                caster.position[1] += speed * vector[1] * ts;
                caster.mana -= 1;

                const [cx, cy] = caster.GetCenter();

                ctx.beginPath();
                ctx.moveTo(cx * scale + offset[0], cy * scale + offset[1]);
                ctx.lineTo(x * scale + offset[0], y * scale + offset[1]);
                ctx.lineWidth = caster.dimensions[1] * scale;

                const grd = ctx.createLinearGradient(cx * scale + offset[0], cy * scale + offset[1], x * scale + offset[0] + .5 * caster.dimensions[1] * scale, y * scale + offset[1]);
                grd.addColorStop(0, 'rgba(0,0,0, .5)');
                grd.addColorStop(.9, 'rgba(0,0,0, .15)');
                grd.addColorStop(1, 'rgba(0,0,0, 0)');

                ctx.strokeStyle = grd;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }
    }

    function volleyShot({ ctx, scale, offset, caster, vector, tile, grid } = {}) {
        if(caster.modifier) return false;

        const stats = getOrbStats(caster.mpl + 3);
        const center = Vector.add(caster.GetCenter(), Vector.multiply(vector, stats.size * .5 + caster.dimensions[0] * .75));

        // first a orb will have to be built then charged to the size of a orb 2 MPLs higher then normal shots
        // then when the charge is complete the orb will shrink and shoot out the orbs
        const chargeOrb = grid.InsertClient(new MagicProjectile(center, 0, [0, 0], 0, {
            dmg: 0,
            color: 'black',
            owner: caster.id,
            mpl: caster.mpl
        }));

        const totalDuration = 800;
        caster.modifier = {
            name: 'volleyShot:charge',
            duration: totalDuration,
            noMove: true,
            callback: (t) => {
                // the orb was destroyed preventing the cast from being completed
                if(!chargeOrb.inGrid) {
                    caster.modifier = null;
                    return;
                } 

                const completion = (totalDuration - caster.modifier.duration) / totalDuration;
                let r = math.lerp(completion, 0, stats.size)
                
                chargeOrb.position = Vector.sub(center, [.5 * r,.5 * r])
                chargeOrb.dimensions = [r, r];
            },
            onComplete: () => {
                let duration = 0;
                const totalDuration = 400;
                const inaccuracy = 20;

                caster.modifier = {
                    name: 'volleyShot:fire',
                    duration: totalDuration,
                    noMove: true,
                    callback: (t) => {
                        // the orb was destroyed preventing the cast from being completed
                        if(!chargeOrb.inGrid) {
                            caster.modifier = null;
                            return;
                        } 

                        const completion = caster.modifier.duration / totalDuration;
                        let r = math.lerp(completion, 0, stats.size);
                        duration += t;
                        if(duration > (totalDuration / 10)) {
                            duration = 0;

                            const deg = math.rand_int(-inaccuracy, inaccuracy);
                            

                            // shoot projectile inaccuratly
                            const vect = deg != 0 ? Vector.rotate(vector, deg) : vector;

                            const stats = getOrbStats(caster.mpl)
                            grid.InsertClient(new MagicProjectile(center, stats.size, vect, 15, {
                                dmg: stats.dmg,
                                color: 'black',
                                owner: caster.id,
                                mpl: caster.mpl
                            }));
                        }

                        chargeOrb.position = Vector.sub(center, [.5 * r,.5 * r])
                        chargeOrb.dimensions = [r, r];
                    },
                    onComplete: () => { if(chargeOrb.inGrid) grid.Remove(chargeOrb) }
                }
            }
        }
    }

    function recursiveShot({ ctx, scale, offset, caster, vector, tile, grid } = {}) {
        const origin = caster.GetCenter();
        const stats = getOrbStats(caster.mpl)
        const pos = Vector.add(origin, Vector.multiply(vector, stats.size * .5 + Math.SQRT2 * caster.dimensions[0] * .5));
        grid.InsertClient(new RecursiveMagicProjectile(pos, stats.size, vector, speed.projectile, {
            dmg: stats.dmg,
            owner: caster.id,
            mpl: caster.mpl,
            color: 'black',
            splitAt: tile
        }));
        return true;
    }

    function levitation({ caster }) {
        caster.AddTag('NoGravity');
        caster.speed = speed.levitation;
    }

    function flight({ caster }) {
        caster.speed = speed.move;
        caster.AddTag('NoGravity');
    }
    
    function curveShot({ caster, tile, grid, vector } = {}, curveAngle) {
        if(caster.mana < skills.curve_shot.mana) return;

        caster.mana -= skills.curve_shot.mana;
        const center = caster.GetCenter();

        const arc = curveShotArc(center, tile, curveAngle);

        let {size, dmg} = getOrbStats(caster.mpl);

        const circumference = 2 * Math.PI * arc.radius;
        // initial angle of player relative to center of arc
        let angle = Vector.getAngle(Vector.sub(center, arc.center));
        const speed = 15;
        const direction = skills.curve_shot.direction;

        angle += direction * (size / circumference * 360);
        const pos = Vector.add(arc.center, Vector.create(angle, arc.radius));
        grid.InsertClient(new MagicProjectile(pos, size, vector, speed, {
            dmg: dmg,
            color: 'black',
            owner: caster.id,
            mpl: caster.mpl,
            curve: {
                center: Vector.sub(arc.center, [.5 * size, .5 * size]),
                radius: arc.radius,
                angle: angle,
                direction: direction,
                distance: Math.abs(Vector.getAngle(Vector.sub(center, arc.center)) - angle)
            }
        }));
    }
    
    function doubleCurveShot({ caster, tile, grid, vector } = {}, curveAngle) {
        if(caster.mana < skills.double_curve_shot.mana) return;

        caster.mana -= skills.double_curve_shot.mana;
        const center = caster.GetCenter();
        const speed = 15;
        let {size, dmg} = getOrbStats(caster.mpl);

        const points = [
            [center, tile],
            [tile, center]
        ]

        for(let i = 0; i < 2; i++) {
            const arc = curveShotArc(...points[i], curveAngle);
            // initial angle of player relative to center of arc
            let angle = Vector.getAngle(Vector.sub(center, arc.center));

            const circumference = 2 * Math.PI * arc.radius;
            // convert i into 1 or -1 instead of 1 or 0
            const direction = -(i*2-1);

            angle += direction * (size / circumference * 360);
            const pos = Vector.add(arc.center, Vector.create(angle, arc.radius));
            grid.InsertClient(new MagicProjectile(pos, size, vector, speed, {
                dmg: dmg,
                color: 'black',
                owner: caster.id,
                mpl: caster.mpl,
                curve: {
                    center: Vector.sub(arc.center, [.5 * size, .5 * size]),
                    radius: arc.radius,
                    angle: angle,
                    direction: direction,
                    distance: Math.abs(Vector.getAngle(Vector.sub(center, arc.center)) - angle),
                }
            }));

        }
    }

    return {singleShot, doubleShot, tripleShot, shield, shieldShot, superSpeed, recursiveShot, volleyShot, levitation, flight, curveShot, doubleCurveShot}
})();

// UI events

export const keydown = (function() {
    // directly casted from keydown event
    // only extract the needed functions
    // this will enable detection of whether the skill has an event handler or not
    let {singleShot, doubleShot, tripleShot, shield, shieldShot, superSpeed, recursiveShot, volleyShot, levitation, flight} = skillCaster;
    return {singleShot, doubleShot, tripleShot, shield, shieldShot, superSpeed, recursiveShot, volleyShot, levitation, flight}
}());

export const tick = (function() {
    function curveShot({ ctx, scale, offset, caster, tile } = {}) {
        // console.log(caster.GetCenter(), tile)
        const arc = curveShotArc(caster.GetCenter(), tile, skills.curve_shot.curve);
        // console.log(arc)
        ctx.strokeStyle = 'rgba(0,0,0, .5)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(arc.center[0] * scale + offset[0], arc.center[1] * scale + offset[1], arc.radius * scale, arc.angleA * Vector.DEG_TO_RAD_SCALE, arc.angleB * Vector.DEG_TO_RAD_SCALE);
        ctx.stroke();

        // ctx.strokeStyle = 'rgba(0,255,0, 1)';
        // ctx.lineWidth = 3;

        // ctx.beginPath();
        // ctx.moveTo(...p(caster.GetCenter()));
        // ctx.lineTo(...p(Vector.add(caster.GetCenter(), Vector.multiply(arc.vectors[0], 5))));
        // ctx.stroke();

        // ctx.beginPath();
        // ctx.moveTo(...p(tile));
        // ctx.lineTo(...p(Vector.add(tile, Vector.multiply(arc.vectors[1], 5))));
        // ctx.stroke();

        // ctx.strokeStyle = 'rgba(255,0,0, 1)';
        // ctx.lineWidth = 3;

        // ctx.beginPath();
        // ctx.moveTo(...p(caster.GetCenter()));
        // ctx.lineTo(...p(Vector.add(caster.GetCenter(), Vector.multiply(arc.vectors[0], -5))));
        // ctx.stroke();

        // ctx.beginPath();
        // ctx.moveTo(...p(tile));
        // ctx.lineTo(...p(Vector.add(tile, Vector.multiply(arc.vectors[1], -5))));
        // ctx.stroke();

        // ctx.strokeStyle = null;
        // ctx.lineWidth = null;
        // ctx.lineCap = null;
    }

    function doubleCurveShot({ ctx, scale, offset, caster, tile } = {}) {
        const center = caster.GetCenter();
        // console.log(caster.GetCenter(), tile)
        let arc = curveShotArc(center, tile, skills.double_curve_shot.curve);
        // console.log(arc)
        ctx.strokeStyle = 'rgba(0,0,0, .5)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(arc.center[0] * scale + offset[0], arc.center[1] * scale + offset[1], arc.radius * scale, arc.angleA * Vector.DEG_TO_RAD_SCALE, arc.angleB * Vector.DEG_TO_RAD_SCALE);
        ctx.stroke();

        arc = curveShotArc(tile, center, skills.double_curve_shot.curve);
        ctx.beginPath();
        ctx.arc(arc.center[0] * scale + offset[0], arc.center[1] * scale + offset[1], arc.radius * scale, arc.angleA * Vector.DEG_TO_RAD_SCALE, arc.angleB * Vector.DEG_TO_RAD_SCALE);
        ctx.stroke();

    }

    return {curveShot, doubleCurveShot}
})();

export const click = (function() {
    function curveShot(ev) {
        skillCaster.curveShot(ev, skills.curve_shot.curve);
    }

    function doubleCurveShot(ev) {
        skillCaster.doubleCurveShot(ev, skills.double_curve_shot.curve);
    }
    
    return {curveShot, doubleCurveShot}
})();

export const scroll = (function() {
    function curveShot({scrollDelta} = {}) {
        skills.curve_shot.curve -= scrollDelta/100 * 3.6;
        skills.curve_shot.curve = math.clamp(skills.curve_shot.curve, 1, 50)
    }

    function doubleCurveShot({scrollDelta} = {}) {
        skills.double_curve_shot.curve -= scrollDelta/100 * 3.6;
        skills.double_curve_shot.curve = math.clamp(skills.double_curve_shot.curve, 1, 50)
    }

    return {curveShot, doubleCurveShot}
})();

// export const keyup = (function() {

//     return {curveShot}
// })();

// const waveAngles = [];
// for(let i = 0; i < 360; i++) waveAngles.push(i);

// export function waveShot({ grid, caster, vector, foward = 1 } = {}) {
//     multiShot(grid, caster, vector, foward, waveAngles);
// }