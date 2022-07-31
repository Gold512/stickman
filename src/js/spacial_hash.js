import {math} from './math.js';

export class SpatialHash {
  constructor(bounds, dimensions) {
    const [x, y] = dimensions;
    this._cells = [...Array(x)].map(_ => [...Array(y)].map(_ => (null)));
    this._dimensions = dimensions;
    this._bounds = bounds;
    this._queryIds = 0;
    this._step = {};
    this._step_id_counter = 0;
  }

  /**
   * Create a new object 
   * @param {Number[]} position an array in the format [x, y]
   * @param {Number[]} dimensions size of the object in the format [width, height] 
   * @param {Number[]} client the client to add, defaults to a base Client class
   * @returns created client
   */
  NewClient(position, dimensions) {
    const client = new Client(position, dimensions);

    this._Insert(client);

    return client;
  }

  InsertClient(client) {
    this._Insert(client);

    if(typeof client.Step == 'function') {
      const step_entry_id = String(this._step_id_counter);
      this._step_id_counter++;

      client._step_entry_id = step_entry_id;
      this._step[step_entry_id] = client;
    }
    
    return client;
  }

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
  }

  /**
   * Rectangular search for clients around a central point
   * @param {Number[]} position the coords of the center of the search region
   * @param {Number[]} dimensions the size of the search region 
   * @returns 
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

  Remove(client) {
    this._Remove(client);
    if(client._step_entry_id) delete this._step[client._step_entry_id];
  }

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
   * Call step function for objects that need to be updated like projectiles
   * @param {Number} t the amount of time elapsed
   */
  Step(t) {
    for(let i = 0, k = Object.keys(this._step); i < k.length; i++) {
      if(!this._step[k[i]]) continue; // object no longer exists
      this._step[k[i]].Step(t);
      this.UpdateClient(this._step[k[i]]); // Automatically update the object
    }
  }

  _GetCellIndex(position) {
    const x = math.sat((position[0] - this._bounds[0][0]) / (
        this._bounds[1][0] - this._bounds[0][0]));
    const y = math.sat((position[1] - this._bounds[0][1]) / (
        this._bounds[1][1] - this._bounds[0][1]));

    const xIndex = Math.floor(x * (this._dimensions[0] - 1));
    const yIndex = Math.floor(y * (this._dimensions[1] - 1));

    return [xIndex, yIndex];
  }

  _Insert(client) {
    const [x, y] = client.position;
    const [w, h] = client.dimensions;

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);

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
}

export class Client {
  constructor(position, dimensions) {
    this.position = position;
    this.dimensions = dimensions;
    this._cells = {
      min: null,
      max: null,
      nodes: null,
    }
    this.__queryId = -1;
  }
}