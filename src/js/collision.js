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
    },

    /**
     * Helper function to determine whether there is an intersection between the two polygons described
     * by the lists of vertices. Uses the Separating Axis Theorem
     *
     * @param {Object[]} a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
     * @param {Object[]} b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
     * @return {Boolean} true if there is any intersection between the 2 polygons, false otherwise
     */
    Polygon(a, b) {
        var polygons = [a, b];
        var minA, maxA, projected, i, i1, j, minB, maxB;

        for (i = 0; i < polygons.length; i++) {

            // for each polygon, look at each edge of the polygon, and determine if it separates
            // the two shapes
            var polygon = polygons[i];
            for (i1 = 0; i1 < polygon.length; i1++) {

                // grab 2 vertices to create an edge
                var i2 = (i1 + 1) % polygon.length;
                var p1 = polygon[i1];
                var p2 = polygon[i2];

                // find the line perpendicular to this edge
                var normal = { x: p2.y - p1.y, y: p1.x - p2.x };

                minA = maxA = undefined;
                // for each vertex in the first shape, project it onto the line perpendicular to the edge
                // and keep track of the min and max of these values
                for (j = 0; j < a.length; j++) {
                    projected = normal.x * a[j].x + normal.y * a[j].y;
                    if (minA == undefined || projected < minA) {
                        minA = projected;
                    }
                    if (maxA == undefined || projected > maxA) {
                        maxA = projected;
                    }
                }

                // for each vertex in the second shape, project it onto the line perpendicular to the edge
                // and keep track of the min and max of these values
                minB = maxB = undefined;
                for (j = 0; j < b.length; j++) {
                    projected = normal.x * b[j].x + normal.y * b[j].y;
                    if (minB == undefined || projected < minB) {
                        minB = projected;
                    }
                    if (maxB == undefined || projected > maxB) {
                        maxB = projected;
                    }
                }

                // if there is no overlap between the projects, the edge we are looking at separates the two
                // polygons, and we know there is no overlap
                if (maxA < minB || maxB < minA) {
                    return false;
                }
            }
        }
        return true;
    }
}

