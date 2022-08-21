export const collision = {
    /**
     * Check collision of 2 circles
     * @param {Number} p1x first circle x coord
     * @param {Number} p1y first circle y coord
     * @param {Number} r1 first circle radious
     * @param {Number} p2x second circle x pos
     * @param {Number} p2y second circle y pos
     * @param {Number} r2 second circle radius   
     * @returns {Boolean} whether the circles are overlapping
     */
    Circles(p1x, p1y, r1, p2x, p2y, r2) { 
        return (r1 + r2) ** 2 > (p1x - p2x) ** 2 + (p1y - p2y) ** 2;
    },

    /**
     * Check collision of 2 rectangles
     * @param {Number} x1 first rect x coord
     * @param {Number} y1 first rect y coord
     * @param {Number} w1 first rect width
     * @param {Number} h1 first rect height
     * @param {Number} x2 second rect x coord
     * @param {Number} y2 second rect y coord
     * @param {Number} w2 second rect width
     * @param {Number} h2 second rect height
     */
    Rects(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(
            ((x1 + h1) < (y2)) ||
            (y1 > (y2 + h2)) ||
            ((x1 + w1) < x2) ||
            (x1 > (x2 + w2))
        );
    },

    /** collision between rotated rect and unrotated rect */
    RotatedRect() {

    },

    /**
     * Check collision of a rectangle and circle
     * @param {Number} x1 rectangle x coord
     * @param {Number} y1 rectangle y coord
     * @param {Number} w1 rectangle width
     * @param {Number} h1 rectangle height
     * @param {Number} x2 circle x coord
     * @param {Number} y2 circle y coord
     * @param {Number} r2 circle radius
     * @returns {Boolean}
     */
    RectAndCircle(x1, y1, w1, h1, x2, y2, r2) {
        const rect = {x: x1, y: y1, w: w1, h: h1};
        const circle = {x: x2, y: y2, r: r2};

        let distX = Math.abs(circle.x - rect.x-rect.w/2);
        let distY = Math.abs(circle.y - rect.y-rect.h/2);

        if (distX > (rect.w/2 + circle.r)) { return false; }
        if (distY > (rect.h/2 + circle.r)) { return false; }

        if (distX <= (rect.w/2)) { return true; } 
        if (distY <= (rect.h/2)) { return true; }

        let dx=distX-rect.w/2;
        let dy=distY-rect.h/2;
        return (dx*dx+dy*dy<=(circle.r*circle.r));
    }
}

