/**
 * @typedef {[Number, Number]} VectorArray
 */

/**
 * @typedef {[Number, Number]} Position
 */

export const Vector = {
    DEG_TO_RAD_SCALE: Math.PI/180,
    RAD_TO_DEG_SCALE: 180/Math.PI,
    /**
     * Normalise vector
     * @param {VectorArray} vec - the vector to normalise
     * @returns {VectorArray}
     */
    normalise(vec) {
        const [x, y] = vec;
        const scaler = 1/Math.sqrt(x*x + y*y);
        return [x*scaler, y*scaler];
    },
  
    /**
     * Rotate vector by ang degrees
     * @param {VectorArray} vec - The vector to rotate
     * @param {Number} ang - The ang to rotate in degrees
     * @returns {VectorArray}
     */
    rotate(vec, ang) {
      ang = -ang * this.DEG_TO_RAD_SCALE;
      let cos = Math.cos(ang);
      let sin = Math.sin(ang);
      return new Array(Math.round(10000*(vec[0] * cos - vec[1] * sin))/10000, Math.round(10000*(vec[0] * sin + vec[1] * cos))/10000);
    },
    
    add(vec1, vec2) {
      return [vec1[0] + vec2[0], vec1[1] + vec2[1]];
    },

    sub(vec1, vec2) {
      return [vec1[0] - vec2[0], vec1[1] - vec2[1]];
    },

    multiply(vec, x) {
      return [vec[0] * x, vec[1] * x];
    },

    /**
     * Create x,y vector from magnitude and angle
     * @param {Number} angle - the angle of the angle in degrees 
     * @param {Number} magnitude - The magnitude of the vector
     * @returns {VectorArray}
     */
    create(angle, magnitude = 1) {
      angle = angle * this.DEG_TO_RAD_SCALE;
      
      return [
        magnitude * Math.cos(angle),
        magnitude * Math.sin(angle)
      ];
    },

    /**
     * get intersection of 2 vectors from origin points (works in opposite direction of vector as well)
     * @param {Position} o1 - 1st origin
     * @param {VectorArray} v1 - 1st vector
     * @param {Position} o2 - 2nd origin
     * @param {VectorArray} v2 - 2nd vector
     */
    intersection(o1, v1, o2, v2) {
      const m1 = v1[1] / v1[0],
            m2 = v2[1] / v2[0];

      // if lines are parallel, no intersection
      // or lines are directly overlapping at which again, no point of intersection
      if(m1 == m2) return null;

      // line intersection formula 
      const x = (o2[1] - o1[1] + m1*o1[0] - m2*o2[0]) / (m1 - m2);

      // subsitute to get y (uses formula of lines from 2 points)
      // m_AB * x + y_A - m_AB * x_A
      const y = m1 * x + o1[1] - m1*o1[0]

      return [x, y];
    },

    /**
     * Get angle of the vector in degrees from the right of the horizontal axis in
     * anti-clockwise direction
     * @param {VectorArray} vector - The vector to get the angle from 
     * @param {Number} precision - the smallest unit of precision of the angle
     * @returns {Number} the angle in degrees
     */
    getAngle(vector, precision = 0.1) {
      const [x, y] = vector;
      let angle = Math.atan2(y, x);   //radians
      let degrees = angle * this.RAD_TO_DEG_SCALE;  //degrees
      return (360 + Math.round(degrees / precision) * precision) % 360; //round number, avoid decimal fragments
    }
  }