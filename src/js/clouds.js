// Dynamically generated clouds using HTML 5 Canvas and JavaScript

// A Coordinate Class for X,Y data
// Begin by creating a simplistic class to hold position information, a point structure would likely have worked here but I wanted to play with CoffeeScript classes 
var Cloud, CloudProcessor, Coordinate, myclouds;

Coordinate = class Coordinate {
  // Class Constructor (requires a XY coordinate pair)
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  
    // A function to allow the addition of simplistic types to the class
  add(byx, byy) {
    if (arguments.length === 1) {
      this.x = this.x + byx;
      this.y = this.y + byx;
    } else {
      this.x = this.x + byx;
      this.y = this.y + byy;
    }
    return this;
  }

};

// A class to hold cloud information
Cloud = class Cloud {
  // Class Constructor (requires a Coordinate, a scale factor, a opacity factor, and a Coordinate rate)
  constructor(location, scale, opacity, rate) {
    this.location = location;
    this.scale = scale;
    this.opacity = opacity;
    this.rate = rate;
    // A flag to indicate cloud status
    this.alive = true;
  }

  
    // a function to quickly disable the cloud status
  dead() {
    return this.alive = false;
  }

};

// A class to handle rendering and movement of the clouds
CloudProcessor = class CloudProcessor {
  
    // Class Constructor (requires the number of clouds to create)
  constructor(number) {
    var msie, trident, useragent;
    this.number = number;
    
    // these variables are currently pseudo static
    //defined the minimum and maximum scale factor
    this.minscale = 50;
    this.maxscale = 200;
    // defined the minimum and maximum x location  in screen percent
    this.minxpercent = 0;
    this.maxxpercent = 100;
    // defined the minimum and maximum y location  in screen percent
    this.minypercent = 0;
    this.maxypercent = 100;
    // defined the minimum and maximum x opacity in percent
    this.minopacity = 50;
    this.maxopacityt = 100;
    // defined the minimum and maximum x transition rate in pixels per second
    this.minxrate = 50;
    this.maxxrate = 500;
    
    // defined the minimum and maximum y transition rate in pixels per second
    this.minyrate = 0;
    this.maxyrate = 0;
    
    // defined the number of frames per second
    this.frames = 30;
    
    // obtain information about the canvas
    this.canvas = $("#canvas")[0];
    this.ctx = this.canvas.getContext('2d');
    
    // set the canvas size to the window size to prevent unwanted pixelation
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // define arbitrary flags to indicate load and run status
    this.loaded = false;
    this.running = true;
    // load the SVG cloud image (can be replaced with non-SVG for backwards compatibility)
    this.cloudimage = new Image();
    // when the image is loaded this function will be called to continue the loading process
    this.cloudimage.onload = () => {
      return this._doneLoading();
    };
    // begin loading the image

    // IE has no svg image support so use png
    useragent = $(window)[0].navigator.userAgent;
    msie = useragent.indexOf("MSIE");
    trident = useragent.indexOf("Trident");
    if (msie > 0 || trident > 0) {
      this.cloudimage.src = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/309492/cloud.png";
    } else {
      this.cloudimage.src = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/309492/cloud.svg";
    }
  }

  
    // this function continues the construction process and occurs asynchronously after the images loaded
  _doneLoading() {
    var i, lp, ref;
    // obtain the size of the cloud image
    this.cloudwidth = this.cloudimage.width;
    this.cloudheight = this.cloudimage.height;
    
    // populate the cloud particle array
    this.clouds = new Array();
    for (lp = i = 0, ref = this.number; (0 <= ref ? i <= ref : i >= ref); lp = 0 <= ref ? ++i : --i) {
      // create cloud objects
      this.spawn();
    }
    // set signal flag indicating  processor is done loading
    this.loaded = true;
    
    // define update and render interval based off of FPS
    setInterval(() => {
      return this.run();
    }, 1000 / this.frames);
    
    // defined resize window of via
    return $(window).resize(() => {
      return this.resize();
    });
  }

  
    // a function handles a window resize event
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    return this;
  }

  
    // a function to handle  populating the particle array
  spawn() {
    var child;
    child = this.makecloud(false);
    this.clouds.push(child);
    return this;
  }

  
    // a function to create a cloud object (if the cloud should begin offscreen the offscreen flag should be equal to true)
  makecloud(offscreen = false) {
    var child, guesscloudheight, guesscloudwidth, height, opacity, scalefactor, width, x, xrate, y, yrate;
    // get the width of the canvas
    width = $("#canvas").width();
    height = $("#canvas").height();
    
    // randomly generate scale factor of the cloud
    scalefactor = this.randNumber(this.minscale, this.maxscale) / 100;
    
    // randomly generate the cloud XY coordinates of the cloud
    x = Math.floor(width * (this.randNumber(this.minxpercent, this.maxxpercent) / 100));
    y = Math.floor(height * (this.randNumber(this.minypercent, this.maxypercent) / 100));
    
    // estimate the cloud size after scaling
    guesscloudwidth = Math.floor(this.cloudwidth * scalefactor);
    guesscloudheight = Math.floor(this.cloudheight * scalefactor);
    
    // ensure the XY coordinates do not exceed the boundaries of the screen
    y = Math.min(y, height - guesscloudheight);
    x = Math.min(x, width - guesscloudwidth);
    
    // randomly generate the rate of travel
    xrate = this.randNumber(this.minxrate, this.maxxrate) / this.frames;
    yrate = this.randNumber(this.minyrate, this.maxyrate) / this.frames;
    
    // if the cloud is offscreen initially
    if (offscreen === true) {
      
      // determine its offspring location relative to the rate of travel
      //  to ensure proper movement of X only, Y only, or XY movement
      if (xrate === 0) {
        y = -guesscloudheight;
      } else if (yrate === 0) {
        x = -guesscloudwidth;
      } else {
        y = -guesscloudheight;
        if (this.randNumber(0, 1) === 1) {
          x = -x / 2;
        }
      }
    }
    // randomly generate the cloud opacity
    opacity = this.randNumber(this.minopacity, this.maxopacityt) / 100;
    
    //  create and return the cloud object
    child = new Cloud(new Coordinate(x, y), scalefactor, opacity, new Coordinate(xrate, yrate));
    return child;
  }

  
    // this function updates a cloud objects position ( takes a particle array index)
  update(id) {
    var at, height, rate, width;
    // if the cloud is dead ignore the element
    if (this.clouds[id].alive === false) {
      return this;
    }
    // obtain the current screen width and height
    width = $("#canvas").width();
    height = $("#canvas").height();
    //  obtain the rate the clouds traveling
    rate = this.clouds[id].rate;
    //  increment the cloud by that rate
    this.clouds[id].location.add(rate.x, rate.y);
    //  obtain the clouds current location
    at = this.clouds[id].location;
    
    //  determine if the cloud has exceeded the window boundaries and if so make the cloud dead
    if (rate.y === 0) {
      if (at.x > width + this.cloudwidth) {
        this.clouds[id].dead();
      }
    } else if (rate.x === 0) {
      if (at.y > height + this.cloudheight) {
        this.clouds[id].dead();
      }
    } else {
      if (at.x > width + this.cloudwidth && at.y > height + this.cloudheight) {
        this.clouds[id].dead();
      }
    }
    return this;
  }

  
    // this function will respond a cloud if it is dead ( takes a particle array index)
  respawn(id) {
    if (this.clouds[id].alive === true) {
      return this;
    }
    return this.clouds[id] = this.makecloud(true);
  }

  
    // this function updates the position and resapwns dead clouds for all clouds in the particle array
  updateAll() {
    var i, lp, ref, results;
    results = [];
    for (lp = i = 0, ref = this.number; (0 <= ref ? i <= ref : i >= ref); lp = 0 <= ref ? ++i : --i) {
      this.update(lp);
      results.push(this.respawn(lp));
    }
    return results;
  }

  
    // this function draws the particle array to the canvas  
  draw(id) {
    var child, h, location, w;
    // obtain a copy of the cloud object
    child = this.clouds[id];
    // obtain the cloud location
    location = child.location;
    // determine the cloud size  based on scale
    w = Math.floor(this.cloudwidth * child.scale);
    h = Math.floor(this.cloudheight * child.scale);
    // save the current Canvas state
    this.ctx.save();
    // adjust the Canvas Alpha for opacity
    this.ctx.globalAlpha = child.opacity;
    //  trawl the cloud at a given location
    this.ctx.drawImage(this.cloudimage, location.x, location.y, w, h);
    //  restore the Canvas to the previous alpha state
    this.ctx.restore();
    return this;
  }

  
    //this function clears the screen and draws all the clouds  in the particle array
  drawAll() {
    var height, i, lp, ref, results, width;
    // get the screen width and height
    width = $("#canvas").width();
    height = $("#canvas").height();
    //  clear the canvas
    this.ctx.clearRect(0, 0, width, height);
    results = [];
    for (lp = i = 0, ref = this.number; (0 <= ref ? i <= ref : i >= ref); lp = 0 <= ref ? ++i : --i) {
      results.push(this.draw(lp));
    }
    return results;
  }

  
    // this function is called by the timer  and updates and drawls all clouds in the partical array
  run() {
    this.updateAll();
    return this.drawAll();
  }

  
    // this is a generic random integer generator  utilized by the class
  randNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

};