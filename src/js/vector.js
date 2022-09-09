export const Vector = {
    DEG_TO_RAD_SCALE: Math.PI/180,
    /**
     * Normalise vector
     * @param {[Number, Number]} vec the vector to normalise
     * @returns 
     */
    normalise(vec) {
        const [x, y] = vec;
        const scaler = 1/Math.sqrt(x*x + y*y);
        return [x*scaler, y*scaler];
    },
  
    /**
     * Rotate vector by ang degrees
     * @param {[Number, Number]} vec The vector to rotate
     * @param {Number} ang The ang to rotate in degrees
     * @returns 
     */
    rotate(vec, ang) {
      ang = -ang * this.DEG_TO_RAD_SCALE;
      let cos = Math.cos(ang);
      let sin = Math.sin(ang);
      return new Array(Math.round(10000*(vec[0] * cos - vec[1] * sin))/10000, Math.round(10000*(vec[0] * sin + vec[1] * cos))/10000);
    },

    /**
     * Create x,y vector from magnitude and angle
     * @param {Number} magnitude The magnitude of the vector
     * @param {Number} angle the angle of the angle in degrees 
     */
    create(magnitude, angle) {
      angle = angle * this.DEG_TO_RAD_SCALE;
      
      return [
        magnitude * Math.sin(angle),
        magnitude * Math.cos(angle)
      ];
    }
  }