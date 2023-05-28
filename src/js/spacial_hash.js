import { GROUPS } from './const.js';
import quickselect from './libs/quick_select.js';
import {math} from './module/math.js';

export class SpatialHash {
  /**
   * A grid like object container with basic helper functions to manage the objects
   * @param {[Number, Number]|null} bounds the topleft corner of the spacial hash grid or null to create a blank spacial hash
   * @param {[Number, Number]} dimensions the size of the hash grid
   */
  constructor(bounds, dimensions) {
    if(bounds === null) return;

    if(!(bounds[0] instanceof Array)) {
      // If bounds is just the position of the top left corner 
      // Convert it to an array of the top left and bottom right corners
      const [x, y] = bounds;
      bounds = [
        [x, y],
        [x + dimensions[0], y + dimensions[1]]
      ]
    }
    const [x, y] = dimensions;
    this._cells = [...Array(x)].map(_ => [...Array(y)].map(_ => (null)));
    this._dimensions = dimensions;
    this._bounds = bounds;
    this._queryIds = 0;
    this._step = {};
    this._step_id_counter = 0;
    this._idTable = {};
  }

  /**
   * Create a new object 
   * @param {[Number, Number]} position an array in the format [x, y]
   * @param {[Number, Number]} dimensions size of the object in the format [width, height] 
   * @returns created client
   */
  NewClient(position, dimensions) {
    const client = new Client(position, dimensions);
    client.grid = this;
    client.inGrid = true;
    this._idTable[client.id] = client;

    this._Insert(client);

    return client;
  }

  /**
   * Insert client into the spacial hash grid
   * @param {Client} client the client to insert  
   * @returns {Client} the client that was inserted
   */
  InsertClient(client) {
    this._Insert(client);
    client.inGrid = true;
    client.grid = this;

    if(typeof client.Step == 'function') {
      const step_entry_id = String(this._step_id_counter);
      this._step_id_counter++;

      client._step_entry_id = step_entry_id;
      this._step[step_entry_id] = client;
    }

    // Set id 
    this._idTable[client.id] = client;
    
    return client;
  }

  /**
   * Fully removes the client from the spacial hash grid
   * @param {Client} client client to remove
   */
  Remove(client) {
    this._Remove(client);
    client.inGrid = false;
    if(client._step_entry_id) delete this._step[client._step_entry_id];
    delete this._idTable[client.id];
    if(client.OnRemove) client.OnRemove();
  }

  /**
   * Update the client within the grid when it's position has changed
   * @param {Client} client client to update 
   */
  UpdateClient(client) {
    const [x, y] = client.position;
    const [w, h] = client.dimensions;

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

    if (client._cells.min[0] == i1[0] &&
        client._cells.min[1] == i1[1] &&
        client._cells.max[0] == i2[0] &&
        client._cells.max[1] == i2[1]) {
      return;
    }

    this._Remove(client);
    this._Insert(client);
    if(client.Reload) client.Reload();
  }

  /**
   * Rectangular search for clients around a central point
   * @param {[Number, Number]} position the coords of the center of the search region
   * @param {[Number, Number]} dimensions the size of the search region 
   * @returns {Client[]} list of clients found in search region
   */
  FindNear(position, bounds) {
    const [x, y] = position;
    const [w, h] = bounds;

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

    const clients = [];
    const queryId = this._queryIds++;

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        let head = this._cells[x][y];

        while (head) {
          const v = head.client;
          head = head.next;

          if (v._queryId != queryId) {
            v._queryId = queryId;
            clients.push(v);
          }
        }
      }
    }
    return clients;
  }

  /**
   * Circular search for clients around central point
   * @param {[Number, Number]} position position of the center of the search region
   * @param {Number} radius radius of the search region
   * @returns {Client[]} list of clients found in search region
   */
  RadialFindNear(position, radius) {
    const [x, y] = position;

    const i1 = this._GetCellIndex([x - radius, y - radius]);
    const i2 = this._GetCellIndex([x + radius, y + radius]);

    const clients = [];
    const queryId = this._queryIds++;

//     // Define the size of the grid and the circle's center and radius
// const gridSize = 10;
// const center = [5, 5];
// const radius = 4;

// // Initialize the grid as a 2D array of zeros
// const grid = new Array(gridSize).fill(0).map(() => new Array(gridSize).fill(0));

// // Define the Bresenham's algorithm for circle drawing
// function bresenhamCircle(x0, y0, radius) {
//   let x = radius;
//   let y = 0;
//   let decisionOver2 = 1 - x;   // Decision criterion divided by 2 evaluated at x=r, y=0

//   while (y <= x) {
//     // Octant 1
//     grid[x0 + x][y0 + y] = 1;
//     grid[x0 + y][y0 + x] = 1;
//     // Octant 2
//     grid[x0 - x][y0 + y] = 1;
//     grid[x0 - y][y0 + x] = 1;
//     // Octant 3
//     grid[x0 - x][y0 - y] = 1;
//     grid[x0 - y][y0 - x] = 1;
//     // Octant 4
//     grid[x0 + x][y0 - y] = 1;
//     grid[x0 + y][y0 - x] = 1;
//     y++;
//     if (decisionOver2 <= 0) {
//       decisionOver2 += 2 * y + 1;
//     } else {
//       x--;
//       decisionOver2 += 2 * (y - x) + 1;
//     }
//   }
// }

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        if((x - position[0])**2 + (x - position[1])**2 > radius*radius) continue;

        let head = this._cells[x][y];

        while (head) {
          const v = head.client;
          head = head.next;

          if (v._queryId != queryId) {
            v._queryId = queryId;
            clients.push(v);
          }
        }
      }
    }
    return clients;
  }

  /**
   * Get client by id
   * @param {String} id id of the client to get
   * @returns {Client|Null} the client if found or null if the client is not found
   */
  GetClientById(id) {
    return this._idTable[id] ?? null;
  }

  // /**
  //  * Uses an object as a query to search for objects in a grid
  //  * @param {Object} query - Query to search
  //  * @param {Class} query.type type to match (uses instanceof)
  //  * @param {Number} query.limit max amount of results to return
  //  * @returns 
  //  */
  // ClientSelector({
  //   type = null,
  //   limit = Infinity
  // } = {}) {
  //   let res = [];
  //   for(let i in this._idTable) {
  //     const e = this._idTable[i];
  //     if(type && !(e instanceof type)) continue;

  //     res.push(e);
  //     if(res.length >= limit) break;
  //   }
  //   return res;
  // }

  /**
   * @param {Object} query - Query to search
   * @param {[Number, Number]} [query.origin] - centerpoint of search (REQUIRED if bounds are defined)
   * @param {[Number, Number]} [query.bounds] - x and y distance away from centerpoint to search (REQUIRED if origin is defined)
   * @param {('arbitrary'|'nearest')} [query.sort] - pattern to sort
   * @param {Class|Class[]} [query.type] - class or array of classes to check (compares constructor, and as such is a shallow check)
   * @param {Number} [query.limit] - max amount of results to return
   * @returns {Object[]} array of objects found in search
   */
  ClientSelector({
    origin = null,
    bounds = null,
    sort = 'arbitrary',
    type = null,
    limit = Infinity
  } = {}) {
    const clients = [];
    const queryId = this._queryIds++;

    if(type != null) {
      // allow for single type arguments to be passed
      // without being wrapped in an array
      if(!Array.isArray(type)) type = [type];
      // Create set of classes to check 
      type = new Set(type);
    }
    
    let definedLocationParams = 0;
    if(origin) definedLocationParams++;
    if(bounds) definedLocationParams++;

    let i1, i2;

    // define origin x and y coordinates
    const [x, y] = origin || [NaN, NaN];

    if(definedLocationParams === 0) {
      // if there are no location params just search the whole spacial hash
      i1 = [0, 0];
      i2 = [this._dimensions[0] - 1, this._dimensions[1] - 1]

    } else if(definedLocationParams === 1)  {
      throw new Error('Invalid positional search: origin and bounds must be either both defined or undefined')
    
    } else /* if(definedLocationParams === 2) */ {
      const [w, h] = bounds;
      i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
      i2 = this._GetCellIndex([x + w / 2, y + h / 2]);
    }

    // Main search operation
    for_x:for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for_y:for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        let head = this._cells[x][y];

        while (head) {
          const v = head.client;
          head = head.next;

          if (v._queryId != queryId) {
            v._queryId = queryId;

            // check type 
            if(!type || type.has(v.constructor)) 
              clients.push(v);
          }
        }

        if(clients.length >= limit && sort == 'arbitrary') break for_x;
      }
    }

    // Sort if not arbitrary order
    if(sort != 'arbitrary') {
      // subtract 1 from limit as it is based on element index which starts from 0 
      // note that array is partial sorted in place, no assignment needed
      const place = limit == Infinity ? clients.length - 1 : limit - 1
      switch(sort) {
        case 'nearest':
          // clients.sort((a, b) => (a.position[0] + .5 * a.dimensions[0] - x)**2 + (a.position[1] + .5 * a.dimensions[1] - y)**2 - ((b.position[0] + .5 * b.dimensions[0] - x)**2 + (b.position[1] + .5 * b.dimensions[1] - y)))
          quickselect(clients, place, null, null, (a, b) => (a.position[0] + .5 * a.dimensions[0] - x)**2 + (a.position[1] + .5 * a.dimensions[1] - y)**2 - ((b.position[0] + .5 * b.dimensions[0] - x)**2 + (b.position[1] + .5 * b.dimensions[1] - y)**2));
          break;
      }

      // Remove clients above limit
      if(clients.length > limit) clients.length = limit; // method to slice off elements of constant array
    }

    return clients;
  }

  Raycast(x0, y0, x1, y1) {
    let i1 = this._GetCellIndex(x0, y0);
    let i2 = this._GetCellIndex(x1, y1);

    let dx = Math.abs(i2[0] - i1[0]);
    let dy = Math.abs(i2[1] - i1[1]);
    let sx = (i1[0] < i2[0]) ? 1 : -1;
    let sy = (i1[1] < i2[1]) ? 1 : -1;
    let err = dx - dy;

    while(true) {
      let cell=this._cells[i1[0]][i1[1]]; // Do what you need to for this
      if(cell.client) return cell.client;

      if ((i1[0] === i2[0]) && (i1[1] === i2[1])) break;
      var e2 = 2*err;
      if (e2 > -dy) { err -= dy; i1[0]  += sx; }
      if (e2 < dx) { err += dx; i1[1]  += sy; }
    }
  }

  // addEventListener(event, listener) {
  //   if(!this._events[event]) this._events[event] = [];
  //   this._events[event].push(listener);
  // }

  /**
   * Call step function for objects that need to be updated like projectiles
   * @param {Number} t the amount of time elapsed
   */
  Step(t) {
    for(let i = 0, k = Object.keys(this._step); i < k.length; i++) {
      if(!this._step[k[i]]) continue; // object no longer exists
      this._step[k[i]].Step(t);
      if(this._step[k[i]]) this.UpdateClient(this._step[k[i]]); // Automatically update the object
    }
  }

  /**
   * Private function to clear the client from the grid
   * does not do a complete erasure of the object, use Remove() instead
   * @param {Client} client the client to remove from the grid
   */
  _Remove(client) {
    const i1 = client._cells.min;
    const i2 = client._cells.max;

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        const xi = x - i1[0];
        const yi = y - i1[1];
        const node = client._cells.nodes[xi][yi];

        if (node.next) {
          node.next.prev = node.prev;
        }
        if (node.prev) {
          node.prev.next = node.next;
        }

        if (!node.prev) {
          this._cells[x][y] = node.next;
        }
      }
    }

    client._cells.min = null;
    client._cells.max = null;
    client._cells.nodes = null;
  }

  /**
   * Get the corresponding cell index of a given position
   * @param {[Number, Number]} position the position to get the cell index of 
   * @returns {[Number, Number]} the cell index of the specified position
   */
  _GetCellIndex(position) {
    //console.log('_GetCellIndex', position[0], this._bounds[0][0], this._bounds[1][0], this._bounds[0][0])
    const x = math.sat((position[0] - this._bounds[0][0]) / (
        this._bounds[1][0] - this._bounds[0][0]));
    const y = math.sat((position[1] - this._bounds[0][1]) / (
        this._bounds[1][1] - this._bounds[0][1]));
      //console.log(x, y)
    const xIndex = Math.floor(x * (this._dimensions[0] - 1));
    const yIndex = Math.floor(y * (this._dimensions[1] - 1));

    return [xIndex, yIndex];
  }

  /**
   * Private function to insert the client into the grid itself;
   * does NOT handle other actions needed to add the client to the grid
   * @summary internal function, use InsertClient instead 
   * @param {Client} client client to insert into grid cell
   */
  _Insert(client) {
    const [x, y] = client.position;
    const [w, h] = client.dimensions;

    // amount that the client should be in the tile to the right and bottom to be inserted
    // into those tiles
    const OVERLAP_THRESHOLD = 0.1;

    // get corner points of object
    const i1 = this._GetCellIndex([x, y]);
    const i2 = this._GetCellIndex([x + w - OVERLAP_THRESHOLD, y + h - OVERLAP_THRESHOLD]);

    //console.log(i1, i2);

    const nodes = [];

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      nodes.push([]);

      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        const xi = x - i1[0];

        const head = {
          next: null,
          prev: null,
          client: client,
        };

        nodes[xi].push(head);

        head.next = this._cells[x][y];
        if (this._cells[x][y]) {
          this._cells[x][y].prev = head;
        }

        this._cells[x][y] = head;
      }
    }

    client._cells.min = i1;
    client._cells.max = i2;
    client._cells.nodes = nodes;
  }

  toJSON() {
    const clients = [];
    const queryId = this._queryIds++;

    for (let x = 0, xn = this._cells.length; x < xn; ++x) {
      for (let y = 0, yn = this._cells[x].length; y < yn; ++y) {
        let head = this._cells[x][y];

        while (head) {
          const v = head.client;
          head = head.next;

          if (v._queryId != queryId) {
            v._queryId = queryId;
            if(!v.toJSON) throw new Error(`[object ${v.constructor.name}] does not have toJSON method`);
            
            let json = v.toJSON();
            if(!json) continue;
            clients.push(json);
          }
        }
      }
    }

    return {
      clients: clients,
      dimensions: this._dimensions,
      bounds: this._bounds
    };
  }

  /**
   * Convert spacial hash to json and stringify it (numbers to 3 decimal places)
   * @returns {Object}
   */
  toString() {
    return JSON.stringify(this.toJSON(), function(key, val) {
      if(val === undefined) return val;
      return val.toFixed ? Number(val.toFixed(3)) : val;
    });
  }

  /**
   * @param {Object|} json json from spacial_hash.prototype.toJSON or toString 
   * @param {Object<string, Class>} constructors object containing classes with the keys being the name of the class
   */
  static from(json, constructors) {
    if(typeof json === 'string') json = JSON.parse(json);

    const grid = new this(json.bounds, json.dimensions);

    for (let i = 0; i < json.clients.length; i++) {
      const e = json.clients[i];
      const constructor = constructors[e.constructor];
      if(!constructor) throw new Error('Unable to get constructor of ' + e.constructor);
      if(!constructor.from) throw new Error(constructor)
      grid.InsertClient(constructor.from(e));
    }

    return grid;
  }
}

export class Client {
  /**
   * Basic object in the spacial hash grid
   * @param {[Number, Number]} position the spawn position of the client
   * @param {[Number, Number]} dimensions the size of the client
   */
  constructor(position, dimensions) {
    /**
     * position of the client
     * @type {[Number, Number]}
     */
    this.position = position;

    /**
     * size of the client
     * @type {[Number, Number]}
     */
    this.dimensions = dimensions;

    /**
     * grid that this client was inserted to 
     * @type {SpatialHash}
     */
    this.grid = null;

    /** @type {Object} */ 
    this.collision = {
      /** @type {('active'|'passive'|'none')} */
      type: 'passive', 
      /** @type {('rectangle'|'circle')} */
      shape: 'rectangle',
      /** @type {Boolean} */
      solid: true
    }

    /** @type {Number} */
    this.zIndex = 0;
    
    this._cells = {
      min: null,
      max: null,
      nodes: null,
    }
    this.__queryId = -1;
    this.id = Date.now().toString(36) + Math.floor(1e12 + Math.random() * 9e12).toString(36);
    this.inGrid = false;
    this.group = GROUPS.SOLID; // default object group
  }

  // easy positional read write functions 
  get top() {
    return this.position[1];
  }

  set top(value) {
    this.position[1] = value;
  }

  get bottom() {
    return this.position[1] + this.dimensions[1];
  }

  set bottom(value) {
    this.position[1] = value - this.dimensions[1];
  }

  get left() {
    return this.position[0];
  }

  set left(value) {
    this.position[0] = value;
  }

  get right() {
    return this.position[0] + this.dimensions[0];
  }

  set right(value) {
    this.position[0] = value - this.dimensions[0];
  }

  /**
   * Add tags to client which changes how it behaves
   * @param {...('NoGravity'|'NoMovement'|'Static')} tags - all parameters will be added to tags obejct
   */
  AddTag(...tags) {
    if(!this.tags) this.tags = new Set();
    for(let i = 0; i < tags.length; i++) this.tags.add(tags[i]);
  }

  /**
   * Remove tags from client which changes how it behaves
   * @param {...('NoGravity'|'NoMovement'|'Static')} tags - all parameters will be added to tags obejct
   */
  RemoveTag(...tags) {
    if(!this.tags) this.tags = new Set();
    for(let i = 0; i < tags.length; i++) this.tags.delete(tags[i]);
  }

  /**
   * Check if the client has a given tag
   * @param {('NoGravity'|'NoMovement'|'Static')} tag - the tag to check the presence of
   * @returns {Boolean}
   */
  HasTag(tag) {
    return this.tags ? this.tags.has(tag) : false;
  }

  SetZIndex(v) {
    this.zIndex = v;
    return this;
  }

  /**
   * Get the center of the current client
   * @returns {[Number, Number]} the center of the client
   */
  GetCenter() {
    return [
      this.position[0] + .5 * this.dimensions[0],
      this.position[1] + .5 * this.dimensions[1]
    ]
  }

  // All clients must have these functions to work 

  /**
   * Renderer for the object
   * @param {CanvasRenderingContext2D} ctx context to draw the object
   * @param {[Number, Number]} offset x and y offset in pixels to draw the object 
   * @param {Number} scale ratio of units to pixels (scale = pixels/unit)
   */
  Render(ctx, offset, scale) {

  }

  /**
   * Collision event handler for this client
   * @param {Object} ev collision event object 
   * @param {Client[]} ev.objects objects that collided with the caller of this function
   * @param {SpatialHash} ev.grid the grid at which the collision occurred
   * @param {RenderingContext2D} ev.ctx the rendering context at which the grid is binded to
   */
  Collision(ev) {

  }

  // OnRemove() {
  //
  // }

  // helper function for solid collision
  HandleSolidCollision(o) {
    if(!o.CheckCollision || o.CheckCollision(this)) o.SetPosition(this); 
  }

  // debug methods
  showBoundingBox(ctx, offset, scale) {
    ctx.fillStyle = 'rgb(200, 50, 50)';
    ctx.fillRect(this.position[0] * scale + offset[0], this.position[1] * scale + offset[1], this.dimensions[0] * scale, this.dimensions[1] * scale);
  }
}