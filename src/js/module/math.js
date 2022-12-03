/**
 * @typedef {[Number, Number]} Position
 */

export const math = (function() {
  return {
    rand_range: function(a, b) {
      return Math.random() * (b - a) + a;
    },

    rand_normalish: function() {
      const r = Math.random() + Math.random() + Math.random() + Math.random();
      return (r / 4.0) * 2.0 - 1;
    },

    rand_int: function(a, b) {
      return Math.round(Math.random() * (b - a) + a);
    },

    lerp: function(x, a, b) {
      return x * (b - a) + a;
    },

    lerp2d: function(x, a, b) {
      return [x * (b[0] - a[0]) + a[0], x * (b[1] - a[1]) + a[1]];
    },

    smoothstep: function(x, a, b) {
      x = x * x * (3.0 - 2.0 * x);
      return x * (b - a) + a;
    },

    smootherstep: function(x, a, b) {
      x = x * x * x * (x * (x * 6 - 15) + 10);
      return x * (b - a) + a;
    },

    clamp: function(x, a, b) {
      return Math.min(Math.max(x, a), b);
    },

    sat: function(x) {
      return Math.min(Math.max(x, 0.0), 1.0);
    },

    average(...n) {
      let sum = 0;
      for(let i = 0; i < n; i++) {
        sum += n[i];
      }
      return sum / n.length;
    },

    /**
     * 
     * @param {[Position, Position]} line1 
     * @param {[Position, Position]} line2 
     */
    line_intersection: function(line1, line2) {
      const m1 = (line1[0][1] - line1[1][1]) / (line1[0][0] - line1[1][0]),
            m2 = (line2[0][1] - line2[1][1]) / (line2[0][0] - line2[1][0]);

      // if lines are parallel, no intersection
      // or lines are directly overlapping at which again, no point of intersection
      if(m1 == m2) return null;

      let x, y;

      // if line is vertical, the form of the equation is x = c, so just subsitute x
      if(m1 == Infinity) [x, y] = [line1[0][0], m2 * line1[0][0] + line2[0][1] - m2 * line2[0][0]];
      if(m2 == Infinity) [x, y] = [line2[0][0], m1 * line2[0][0] + line1[0][1] - m1 * line1[0][0]];
      
      // line intersection formula 
      x = (line2[0][1] - line1[0][1] + m1*line1[0][0] - m2*line2[0][0]) / (m1 - m2);

      // subsitute to get y (uses formula of lines from 2 points)
      // m_AB * x + y_A - m_AB * x_A
      y = m1 * x + line1[0][1] - m1*line1[0][0];

      // return null if the intersection is not in the range of both lines
      if(
        ( x < Math.min(line1[0][0], line1[1][0]) ) ||
        ( x > Math.max(line1[0][0], line1[1][0]) ) ||

        ( y < Math.min(line1[0][1], line1[1][1]) ) ||
        ( y > Math.max(line1[0][1], line1[1][1]) ) ||

        ( x < Math.min(line2[0][0], line2[1][0]) ) ||
        ( x > Math.max(line2[0][0], line2[1][0]) ) ||

        ( y < Math.min(line2[0][1], line2[1][1]) ) ||
        ( y > Math.max(line2[0][1], line2[1][1]) )
      ) return null;

      return [x, y];
    },

    /**
     * 
     * @param {object[]} options
     * @param {number} options[].weight
     * @param {any} options[].item
     * @returns {any} - selected item
     */
    weighted_random(options) {
      let i;
      let weights = [];
  
      for (i = 0; i < options.length; i++)
        weights[i] = options[i].weight + (weights[i - 1] || 0);
      
      let random = Math.random() * weights[weights.length - 1];
      
      for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
          break;
      
      return options[i].item;
    },

    line_length: function(a, b) {
      return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
    }
  };
})();