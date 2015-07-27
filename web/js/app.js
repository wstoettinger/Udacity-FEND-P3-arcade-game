//
// ### CONSTANTS
//
var COLS = 5;
var ROWS = 6;

var COL_WIDTH = 101;
var ROW_HEIGHT = 83;

var MIN_X = -1 * COL_WIDTH;
var MAX_X = COLS * COL_WIDTH;
var MAX_Y = ROWS * ROW_HEIGHT;

//
// ### Global Variables
//
var globalSpeedMultiplyer = 15; // total game Speed
var individualSpeedBooster = 1; // increases speed for each respawn

var canvasWidth = 505; // will be changed for higher levels
var canvasHeight = 606; // will be changed for higher levels

/* --------
 *   GAME
 * ========
 * 
 * Game logic and vairables
 */
var Game = Class.extend({
  // TODO move part of the game logic from entine to Game class

  levelNr: 1,

  init: function () {
    this.level = new Level();
  },

  render: function () {
    this.level.render();
  },

  nextLevel: function () {
    this.level.setLevel(++this.levelNr);
  }
});

/* -------
 *  LEVEL
 * =======
 * 
 * represents one level
 */
var Level = Class.extend({
  field: [],

  init: function () {
    this.reset();
  },

  restart: function () {
    this.setLevel(1);
    this.reset();
  },

  reset: function () {
    this.setLevel(1);
  },

  render: function () {
    for (var i = 0; i < this.field.length; i++) {
      var row = this.field[i];
      for (var j = 0; j < row.length; j++) {
        var block = row[j];
        block.render();
      }
    }
  },

  setLevel: function (level) {
    switch (level) {
    case 1:
      this.cols = 5;
      this.field = [];

      this.field.push(this.createRow("water", this.field.length, this.cols));
      this.field.push(this.createRow("stone", this.field.length, this.cols));
      this.field.push(this.createRow("stone", this.field.length, this.cols));
      this.field.push(this.createRow("stone", this.field.length, this.cols));
      this.field.push(this.createRow("grass", this.field.length, this.cols));
      this.field.push(this.createRow("grass", this.field.length, this.cols));
      break;
    case 2:
      this.cols = 5;
      this.field = [];

      this.field.push(this.createRow("water", this.field.length, this.cols));
      this.field.push(this.createRow("stone", this.field.length, this.cols));
      this.field.push(this.createRow("stone", this.field.length, this.cols));
      this.field.push(this.createRow("stone", this.field.length, this.cols));
      this.field.push(this.createRow("stone", this.field.length, this.cols));
      this.field.push(this.createRow("grass", this.field.length, this.cols));
      break;
    }
    this.rows = this.field.length;
  },

  createRow: function (type, row, cols) {
    var ret = [];
    for (var i = 0; i < cols; i++)
      ret.push(new Block(row, i, type));
    return ret;
  },

  getStoneRowsIndizes: function () {
    var ret = [];
    for (var i = 0; i < this.field.length; i++) {
      var row = this.field[i];
      if (row[0].type == "stone")
        ret.push(i);
    }
    return ret;
  }

});

//
// ### Entity
//
// base class for all entities in the game (player, enemies, gems, goal, etc.)
var Entity = Class.extend({

  // prototype variables
  sprite: "",
  value: 0,
  lives: 0,
  active: true,
  yAdjustment: -25,
  row: 0,
  col: 0,
  speed: 0,
  display: true,
  rotate: 0,
  scale: {
    x: 1,
    y: 1
  },

  // init Entity 
  init: function () {
    // init stuff goes here.
  },

  // gets called when the game is restarted
  restart: function () {
    this.init();
    // this.reset() has to be called in the subclass.init() function
  },

  // reset Entity, gets called when the player hits the goal or gets killed, when an enemy leaves the screen, or when a gem is collected
  reset: function () {
    // revert the variables back to the prototype variables
    delete this.row;
    delete this.col;
    delete this.speed;
    delete this.display;
    delete this.active;
    delete this.rotate;
    delete this.scale;

    // calculate the absolute x,y position based on row and col
    this.x = this.col * COL_WIDTH;
    this.y = this.row * ROW_HEIGHT + this.yAdjustment;

    if (this.showHandler)
      clearTimeout(this.showHandler);
    if (this.hideHandler)
      clearTimeout(this.hideHandler);
  },

  // change position of the entity (gets called before render)
  update: function (dt) {
    // behaviour stuff goes here.
    this.x += this.speed * dt * globalSpeedMultiplyer;
  },

  // render the entity
  render: function () {

    if (this.display) {
      ctx.save();
      ctx.translate(this.x + COLD_WIDTH / 2, this.y + ROW_HEIGHT / 2);
      ctx.rotate(this.rotate * Math.PI / 180);
      ctx.scale(this.scale.x, this.scale.y);
      ctx.drawImage(Resources.get(this.sprite), -COLD_WIDTH / 2, -ROW_HEIGHT / 2);
      ctx.restore();
    }

  },

  // check if this entity touches the player (gets called after render)
  touchesPlayer: function (player) {
    if (!this.active || this instanceof Player || this.row != player.row)
      return false;

    return this.x > player.x - COLD_WIDTH * 0.75 && this.x < player.x + COLD_WIDTH * 0.75;
  },

  // gets called after Entity.touchesPlayer returns true
  hitPlayer: function (player) {
    if (this instanceof Player || !player.active)
      return;
    player.hitBy(this);
  },

  // returns the value of the Entity (in game score points)
  getValue: function () {
    return this.value;
  },

  // returns the lives of the Entity (in case of a Player, these are the absolute lives, in case of Enemies, this is -1, in case of 1-UPs this is +1) 
  getLives: function () {
    return this.lives;
  },

  // wrapper function which calls the show function when triggered by the timer
  _callShow: function (self) {
    self.show();
  },

  // shows the entity (gets rendered)
  show: function () {
    this.display = true;
  },

  // shows the entity until a given timeout and then hides it
  showUntil: function (seconds) {
    this.display = true;
    if (this.showHandler)
      clearTimeout(this.showHandler);
    this.hideHandler = setTimeout(this._callHide, seconds * 1000, this); // set a timeout (between 10 and 20 seconds) to display the gem.
  },

  // wrapper function which calls the hide function when triggered by the timer
  _callHide: function (self) {
    self.hide();
  },

  // hides the entity (doesn't get renderd)
  hide: function () {
    this.display = false;
  },

  // hides the entity until a given timeout and then shows it
  hideUntil: function (seconds) {
    this.display = false;
    if (this.hideHandler)
      clearTimeout(this.hideHandler);
    this.showHandler = setTimeout(this._callShow, seconds * 1000, this); // set a timeout (between 10 and 20 seconds) to display the gem.
  },

  // deactivates the entity (e.g. when Game Over)
  deactivate: function () {
    this.active = false;

    if (this.showHandler)
      clearTimeout(this.showHandler);
    if (this.hideHandler)
      clearTimeout(this.hideHandler);

    /*
     * setting speed to 0 would delete the direction of the enemies, causing them to turn around on the game-over screen, that's why its multiplied.
     */
    if (Math.abs(this.speed) > 1)
      this.speed *= 0.1;
  }

});

/* -------
 *  Block
 * =======
 * 
 * represents a block of the game area (grass, stone or water)
 */
var Block = Entity.extend({
  type: "grass",
  images: {
    grass: "images/grass-block.png",
    stone: "images/stone-block.png",
    water: "images/water-block.png",
  },

  init: function (row, col, type) {
    this.row = row;
    this.col = col;
    this.type = type;

    this.x = this.col * COLD_WIDTH;
    this.y = this.row * ROW_HEIGHT;
    this.sprite = this.images[this.type];
  }
});

//
// ### ENEMY
//
var Enemy = Entity.extend({

  sprite: "images/enemy-bug.png",
  value: -100,
  lives: -1,
  possibleRows: [],

  // init 
  init: function () {
    this.reset();
  },

  // override the restart function
  restart: function () {
    this.init();

    // at the beginning of the game, set the column of the enemy randomly, later they will only come form outside the canvas
    this.col = Math.floor(Math.random() * 5); // set a random row (0 to 4)
    this.x = this.col * COLD_WIDTH;
  },

  // Respawn enemy after it left the screen
  reset: function () {
    this._super(); // call the inherited function

    var direction = ((Math.floor((Math.random() * 2) + 1) * 2) - 3); // generates 1 or -1
    this.row = this.possibleRows[Math.floor(Math.random() * this.possibleRows.length)];
    this.speed = Math.floor((Math.random() * (5 + individualSpeedBooster)) + 2) * direction;

    this.col = -1; // col -1 or 5
    if (this.speed < 0) { // reset to the right most column when speed is negative
      this.col = COLS;

      // horizontally flip the sprite:
      this.scale = {
        x: -1,
        y: 1
      };
    }

    // calculate the absolute x,y position based on row and col
    this.x = this.col * COLD_WIDTH;
    this.y = this.row * ROW_HEIGHT + this.yAdjustment;
  },

  // Update the enemy's position, required method for game
  // Parameter: dt, a time delta between ticks
  update: function (dt) {
    this._super(dt);

    // reset the Enemy when it left the game board
    if (this.x > MAX_X || this.x < MIN_X)
      this.reset();
  },

  setPossibleRows: function (rows) {
    this.possibleRows = rows;
  }
});

//
// ### GEM
//
var Gem = Entity.extend({

  sprite: "images/gem-blue.png",
  value: 200,
  yAdjustment: -10,

  // init 
  init: function () {
    this.reset();
  },

  /*  
   * override the reset function.
   * hide the Gem, reset coordinates, set timer
   */
  reset: function () {
    this._super(); // call the inherited super function

    this.scale = {
      x: 0.7,
      y: 0.7
    };

    this.row = Math.floor((Math.random() * 3) + 1); // set a random row (1 to 3)
    this.col = Math.floor(Math.random() * 5); // set a random row (0 to 4)
    this.hideUntil(Math.floor((Math.random() * 5) + 6)); // set a timeout (between 5 and 10 seconds) to display the gem.

    // calculate the absolute x,y position based on row and col
    this.x = this.col * COLD_WIDTH;
    this.y = this.row * ROW_HEIGHT + this.yAdjustment;
  },

  // override show function
  show: function () {
    this.showUntil(Math.floor((Math.random() * 3) + 3)); // set a timeout to hide it again (between 3 and 5 seconds) and then call the reset function.
  },

  // override hide function
  hide: function () {
    this.reset();
  },

  // override hitPlayer function
  hitPlayer: function (player) {
    if (this.display) {
      this._super(player);
      this.reset();
    }
  }
});

//
// ### PLAYER 
//
var Player = Entity.extend({
  sprite: "images/char-boy.png",
  score: 0,
  lives: 3,
  chars: [
    "images/char-boy.png",
    "images/char-cat-girl.png",
    "images/char-horn-girl.png",
    "images/char-pink-girl.png",
    "images/char-princess-girl.png",
  ],
  charValues: [
    0,
    100,
    100,
    100,
    200,
  ],
  charNr: 0,
  // get called when the player finishes a level
  levelUpCallbacks: [],

  init: function () {
    this.reset();
  },

  restart: function () {
    this.reset();

    delete this.score;
    delete this.lives;
    delete this.charNr;
  },

  reset: function () {
    this._super(); // call the inherited super function

    this.row = 5; // starting position
    this.col = 2;

    this.sprite = this.chars[this.charNr];

    this.x = this.col * COLD_WIDTH;
    this.y = this.row * ROW_HEIGHT + this.yAdjustment;
  },

  move: function (moveCols, moveRows) {
    if (this.active) {

      this.col += moveCols;
      this.row += moveRows;

      // check if player would move off screen
      if (this.row < 0)
        this.row = 0;
      else if (this.row >= ROWS)
        this.row = ROWS - 1;

      // check if player would move off screen
      if (this.col < 0)
        this.col = 0;
      else if (this.col >= COLS)
        this.col = COLS - 1;

      // calculate the absolute x,y position based on row and col
      this.x = this.col * COLD_WIDTH;
      this.y = this.row * ROW_HEIGHT + this.yAdjustment;
    }
  },

  hitBy: function (entity) {
    // interact with the entity by adding its value and lives

    this.score += entity.getValue();
    this.lives += entity.getLives();

    if (entity instanceof Enemy) {
      if (this.lives > 0)
        this.reset();
      else
        this.deactivate();
    }
    else if (entity instanceof Goal) {
      this.score += this.value; // each char has a different value
      this.nextChar();
      this.reset();
    }
  },

  nextChar: function () {
    this.charNr++;
    if (this.charNr >= this.chars.length) {
      this.charNr = 0;

      this.levelUpCallbacks.forEach(function (func) {
        func();
      });
    }
    this.value = this.charValues[this.charNr]; // each char has a different value
  },

  onLevelUp: function (func) {
    this.levelUpCallbacks.push(func);
  }
});

//
// ### GOAL
// this class represents the goal wich the player has to reach (the top row).
var Goal = Entity.extend({
  sprite: "images/selector.png",
  value: 400,

  // init 
  init: function () {
    this.reset();
  },

  reset: function () {
    this._super();
    this.display = false;
  },

  touchesPlayer: function (player) {
    if (this.row == player.row)
      return true;
    return false;
  }
});

var player = new Player();
var gem = new Gem();
var goal = new Goal();
var allEntities = [];

var game = new Game();