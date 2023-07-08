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
		return !(y1 + h1 < y2 || y1 > y2 + h2 || x1 + w1 < x2 || x1 > x2 + w2);
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
		const rect = { x: x1, y: y1, w: w1, h: h1 };
		const circle = { x: x2, y: y2, r: r2 };

		let distX = Math.abs(circle.x - rect.x - rect.w / 2);
		let distY = Math.abs(circle.y - rect.y - rect.h / 2);

		if (distX > rect.w / 2 + circle.r) {
			return false;
		}
		if (distY > rect.h / 2 + circle.r) {
			return false;
		}

		if (distX <= rect.w / 2) {
			return true;
		}
		if (distY <= rect.h / 2) {
			return true;
		}

		let dx = distX - rect.w / 2;
		let dy = distY - rect.h / 2;
		return dx * dx + dy * dy <= circle.r * circle.r;
	},

	/**
     * 
     * @param {number} x1 - points of line
     * @param {number} y1 - points of line
     * @param {number} x2 - points of line
     * @param {number} y2 - points of line
     * @param {number} x - center of circle
     * @param {number} y - center of circle
     * @param {number} radius - radius of circle 
     */
	LineAndCircle(x1, y1, x2, y2, x, y, radius) {
        // change equation of line to form a*x + b*y + c = 0
        const a = y1 - y2;
        const b = x2 - x1;
        const c = x1 * y2 - x2 * y1;

        // Finding the distance of line from center.
        let dist = (Math.abs(a * x + b * y + c)) /
                        Math.sqrt(a * a + b * b);
       
        // Checking if the distance is less than,
        // greater than or equal to radius.
        return radius >= dist;
	},

    /**
     * line and rectangle intersection (by ChatGPT)
     * @param {number} x1 first line x coordinate
     * @param {number} y1 first line y coordinate
     * @param {number} x2 first line x coordinate
     * @param {number} y2 first line y coordinate
     * @param {number} x3 x of top left corner of rectangle
     * @param {number} y3 y of top left corner of rectangle
     * @param {number} rectangleWidth width of rectangle
     * @param {number} rectangleHeight height of rectangle
     * @returns {boolean}
     */
    LineAndRect(x1, y1, x2, y2, x3, y3, rectangleWidth, rectangleHeight) {
        // Get the coordinates of the rectangle
        const x4 = x3 + rectangleWidth;
        const y4 = y3 + rectangleHeight;
      
        // Calculate the intersection points of the line and the rectangle
        const denominator = ((x1 - x2) * (y3 - y4)) - ((y1 - y2) * (x3 - x4));
        const numerator1 = ((x1 * y2) - (y1 * x2)) * (x3 - x4);
        const numerator2 = ((x1 * y2) - (y1 * x2)) * (y3 - y4);
        const x = (numerator1 - numerator2) / denominator;
        const y = (((x1 * y2) - (y1 * x2)) * (y3 - y4) - ((x1 - x2) * (y3 * y4))) / denominator;
      
        // Check if the intersection points are within the bounds of the line and the rectangle
        return (x >= Math.min(x1, x2) && x <= Math.max(x1, x2)) && (y >= Math.min(y1, y2) && y <= Math.max(y1, y2)) && (x >= Math.min(x3, x4) && x <= Math.max(x3, x4)) && (y >= Math.min(y3, y4) && y <= Math.max(y3, y4));
      },      

	/**
	 * Helper function to determine whether there is an intersection between the two polygons described
	 * by the lists of vertices. Uses the Separating Axis Theorem
	 *
	 * @param {import("./vector").Vector2D[]} a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
	 * @param {import("./vector").Vector2D[]} b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
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
				var normal = [p2[1] - p1[1], p1[0] - p2[0]];

				minA = maxA = undefined;
				// for each vertex in the first shape, project it onto the line perpendicular to the edge
				// and keep track of the min and max of these values
				for (j = 0; j < a.length; j++) {
					projected = normal[0] * a[j][0] + normal[1] * a[j][1];
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
					projected = normal[0] * b[j][0] + normal[1] * b[j][1];
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
	},

	/**
	 * Check intersection of circle and triangle 
	 * @param {number} c1x
	 * @param {number} c1y
	 * @param {number} centrex
	 * @param {number} centrey
	 * @param {number} v1x
	 * @param {number} v1y
	 * @param {number} v2x
	 * @param {number} v2y
	 * @param {number} v3x
	 * @param {number} v3y
	 * @returns {Boolean}
	 */
	CircleAndTriangle(
		c1x,
		c1y,
		centrex,
		centrey,
		v1x,
		v1y,
		v2x,
		v2y,
		v3x,
		v3y
	  ) {
		//
		// TEST 1: Vertex within circle
		//
		c1x = centrex - v1x;
		c1y = centrey - v1y;
	  
		let radiusSqr = radius * radius;
		let c1sqr = c1x * c1x + c1y * c1y - radiusSqr;
	  
		if (c1sqr <= 0) return true;
	  
		let c2x = centrex - v2x;
		let c2y = centrey - v2y;
		let c2sqr = c2x * c2x + c2y * c2y - radiusSqr;
	  
		if (c2sqr <= 0) return true;
	  
		let c3x = centrex - v3x;
		let c3y = centrey - v3y;
	  
		let c3sqr = c3x * c3x + c3y * c3y - radiusSqr;
	  
		if (c3sqr <= 0) return true;
	  
		// ;
		// ; TEST 2: Circle centre within triangle
		// ;
	  
		// ;
		// ; Calculate edges
		// ;
		let e1x = v2x - v1x;
		let e1y = v2y - v1y;
	  
		let e2x = v3x - v2x;
		let e2y = v3y - v2y;
	  
		let e3x = v1x - v3x;
		let e3y = v1y - v3y;
	  
		if (
		  Math.sign(
			(e1y * c1x - e1x * c1y) |
			  (e2y * c2x - e2x * c2y) |
			  (e3y * c3x - e3x * c3y)
		  ) >= 0
		)
		  return true;
	  
		// ;
		// ; TEST 3: Circle intersects edge
		// ;
		let k = c1x * e1x + c1y * e1y;
	  
		if (k > 0) {
		  len = e1x * e1x + e1y * e1y; // ; squared len
	  
		  if (k < len) {
			if (c1sqr * len <= k * k) return true;
		  }
		}
	  
		// ; Second edge
		k = c2x * e2x + c2y * e2y;
	  
		if (k > 0) {
		  let len = e2x * e2x + e2y * e2y;
	  
		  if (k < len) {
			if (c2sqr * len <= k * k) return true;
		  }
		}
	  
		// ; Third edge
		k = c3x * e3x + c3y * e3y;
	  
		if (k > 0) {
		  len = e3x * e3x + e3y * e3y;
	  
		  if (k < len) {
			if (c3sqr * len <= k * k) return true;
		  }
		}
	  
		// ; We're done, no intersection
		return false;
	  }
	  
};

const intersection = {
	/**
	 *
	 * @param {[[number, number], [number, number]]} line 2 points of the line
	 * @param {[[number, number], [number, number]]} square [(x, y), (width, height)] of the square
	 * @returns {[number, number][]} - list of points of intersection
	 */
	LineAndSquare(line, square) {
		// First, we need to get the equation of the line in the form of "y = mx + b"
		// We can use the coordinates of two points on the line to do this
		const [x1, y1] = line[0];
		const [x2, y2] = line[1];
		let m, b;
		if (x1 === x2) {
			// The line is vertical, so its slope is infinite
			m = Infinity;
			b = x1;
		} else {
			m = (y2 - y1) / (x2 - x1);
			b = y1 - m * x1;
		}

		// Next, we need to get the coordinates of the square's edges
		const [xMin, yMin] = square[0];
		const [xMax, yMax] = [
			square[0][0] + square[1][0],
			square[0][1] + square[1][1],
		];

		// Now we can use the equation of the line and the coordinates of the square's edges
		// to find the points where the line intersects the square
		const intersections = [];
		if (m === Infinity) {
			// The line is vertical, so it intersects the square at the line's x-coordinate
			if (yMin <= x1 && x1 <= yMax) {
				intersections.push([x1, yMin], [x1, yMax]);
			}
		} else {
			if (xMin <= (yMin - b) / m && (yMin - b) / m <= xMax) {
				intersections.push([(yMin - b) / m, yMin]);
			}
			if (xMin <= (yMax - b) / m && (yMax - b) / m <= xMax) {
				intersections.push([(yMax - b) / m, yMax]);
			}
			if (yMin <= m * xMin + b && m * xMin + b <= yMax) {
				intersections.push([xMin, m * xMin + b]);
			}
			if (yMin <= m * xMax + b && m * xMax + b <= yMax) {
				intersections.push([xMax, m * xMax + b]);
			}
		}
		return intersections;
	},
};
