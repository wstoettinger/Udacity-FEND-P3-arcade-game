//
// ### CONSTANTS
//
var cols = 5;
var rows = 6;

var colWidth = 101;
var rowHeight = 83;
var heightAdjustment = -25;

var minX = -1 * colWidth;
var maxX = cols * colWidth;
var maxY = rows * rowHeight;

var globalSpeedMultiplyer = 15; // total game Speed
var individualSpeedBooster = 1; // increases speed for each respawn

var canvasWidth = 505;
var canvasHeight = 606;
/*
// create a function for inheritance
Object.prototype.extend = function (objectToExtend) {
  var classDef = function () {
    if (arguments[0] !== Object) {
      this.construct.apply(this, arguments);
    }
  };

  var proto = new this(Object);
  var superClass = this.prototype;

  for (var n in objectToExtend) {
    var item = objectToExtend[n];
    if (item instanceof Function) item.$ = superClass;
    proto[n] = item;
  }

  classDef.prototype = proto;

  //Give this new class the same static extend method    
  classDef.extend = this.extend;
  return classDef;
};
*/

//
// ### Entity
//
// base class for all entities in the game (player, enemies, gems)
function Entity() {
  this.init();
  this.reset();
}

// init Entity 
Entity.prototype.init = function () {
  // init stuff goes here.
}

// reset Entity 
Entity.prototype.reset = function () {
  // reset stuff goes here.
  this.row = 0;
  this.col = 0;
  this.renderSprite = false;
  this.stopped = false;
}

// change position of the entity (gets called before render)
Entity.prototype.update = function (dt) {
  // behaviour stuff goes here.
  this.x = this.col * colWidth;
  this.y = this.row * rowHeight + heightAdjustment;
}

// render the entity
Entity.prototype.render = function () {
  if (this.renderSprite)
    ctx.drawImage(Resources.get(this.getSpritePath()), this.x, this.y);
}

// this function needs to be overloaded to return the image that should be displayed.
Entity.prototype.getSpritePath = function () {
  return "";
}

// check if this enemy touches the player (gets called after render)
Entity.prototype.touchesPlayer = function (player) {
  if (this.row != player.row)
    return false;
  if (this.x > player.x - colWidth * 0.75 && this.x < player.x + colWidth * 0.75)
    return true;
  return false;
}

// gets called after Entity.touchesPlayer returns true
Entity.prototype.hitPlayer = function (player) {
  // empty in the base class
}

// should be implemented to stop the behaviour of the entity
Entity.prototype.stop = function () {
  this.stopped = true;
}

//
// ### GEM
//
function Gem() {
  this.init();
  this.reset();
}

Gem.prototype = Object.create(Entity.prototype); // inherit Gem from Entity
Gem.prototype.constructor = Gem; // set constructor to Gem function

/*  
 * overload the reset function
 */
Gem.prototype.reset = function () {
  Object.getPrototypeOf(Gem.prototype).reset.call(this); // call the function inherited by super class 

  if (!this.stopped) {
    this.renderSprite = false;
    this.row = Math.floor((Math.random() * 3) + 1); // set a random row (1 to 3)
    this.col = Math.floor(Math.random() * 5); // set a random row (0 to 4)

    setTimeout(this.showGem, Math.floor((Math.random() * 10) + 5) * 1000, this); // set a timeout (between 10 and 20 seconds) to display the gem.
  }
}

Gem.prototype.showGem = function (gem) {
  if (!this.stopped) {
    gem.renderSprite = true; // set the variable to show the gem.
    setTimeout(gem.hideGem, Math.floor((Math.random() * 3) + 3) * 1000, gem); // set a timeout to hide it again (between 3 and 5 seconds) and then call the reset function.
  }
}

Gem.prototype.hideGem = function (gem) {
  gem.reset();
}

/*
 * overload the getSpirtePath function
 */
Gem.prototype.getSpritePath = function () {
  return "images/gem-blue.png";
}

/* 
 * overload the hitPlayer function
 */
Gem.prototype.hitPlayer = function (player) {
  Object.getPrototypeOf(Gem.prototype).hitPlayer.call(this); // call the function inherited by super class
  player.scored(400);
  this.reset();
}

//
// ### ENEMY
//
function Enemy(row, speed) {
  this.sprite = "images/enemy-bug.png";
  this.respawn(row, speed);
}

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function (dt) {
  if (this.x > maxX || this.x < minX)
    this.respawn();
  else
    this.x += this.speed * dt * globalSpeedMultiplyer;
}

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function () {
  if (this.speed < 0) {
    ctx.scale(-1, 1);
    ctx.drawImage(Resources.get(this.sprite), -this.x - 1 * colWidth, this.y);
    ctx.scale(-1, 1);
  }
  else
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

// Respawn enemy after it left the screen
Enemy.prototype.respawn = function (row, speed) {

  this.direction = ((Math.floor((Math.random() * 2) + 1) * 2) - 3); // generates 1 or -1
  this.row = typeof row !== 'undefined' ? row : Math.floor((Math.random() * 3) + 1);
  this.speed = typeof speed !== 'undefined' ? speed : Math.floor((Math.random() * (5 + individualSpeedBooster)) + 2) * this.direction;

  this.col = -1; // col -1 or 5
  if (this.direction == -1)
    this.col = cols;

  // calculate the absolute x,y position
  this.x = this.col * colWidth;
  this.y = this.row * rowHeight + heightAdjustment;

  return this;
}

// check if this enemy touches the player.
Enemy.prototype.touchesPlayer = function (player) {
  if (this.row != player.row)
    return false;
  if (this.x > player.x - colWidth * 0.75 && this.x < player.x + colWidth * 0.75)
    return true;
  return false;
}

// sets the speed to (almost) zero (when Game Over)
Enemy.prototype.freeze = function () {
  /*
   * setting speed to 0 would delete the direction of the enemies, causing them to turn around on the game-over screen, that's why its multiplied.
   */
  if (Math.abs(this.speed) > 1)
    this.speed *= 0.1;
}

//
// ### PLAYER 
//
var Player = function () {
  this.sprite = 'images/char-boy.png';
}

// resets score and lives
Player.prototype.reset = function () {
  this.respawn();
  this.score = 0;
  this.lives = 3;
  this.isGameOver = false;
}

// respawns the player when hit or when he/she reached the water
Player.prototype.respawn = function () {
  this.row = 5; // starting position
  this.col = 2;

  this.x = this.col * colWidth;
  this.y = this.row * rowHeight + heightAdjustment;
}

// renders the player, score, lives and the Game Over text
Player.prototype.render = function () {
  var img = Resources.get(this.sprite);
  ctx.drawImage(img, this.x, this.y);

  // render score:
  ctx.fillStyle = "black";
  ctx.font = "30px Open Sans";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + player.score, 10, 36);

  // render lives:
  ctx.drawImage(img, canvasWidth - img.width * 0.4, -15, img.width * 0.4, img.height * 0.4);
  ctx.textAlign = "right";
  ctx.fillText("" + player.lives, canvasWidth - img.width * 0.4 - 10, 36);

  // draw Game Over
  if (this.isGameOver) {
    ctx.fillStyle = "#2c2c2c";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";

    ctx.font = "60px Open Sans";
    ctx.textAlign = "center";
    ctx.strokeText("GAME OVER", canvasWidth / 2, canvasHeight / 2); // white stroke border of the text
    ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2); // black fill text
  }
}

// called, when the player is hit by an enemy
Player.prototype.hit = function () {
  this.lives -= 1;
  this.score -= 100;

  if (this.lives == 0)
    this.isGameOver = true;
  else
    this.respawn();
}

// called when the player scores points (e.g. reaches the water)
Player.prototype.scored = function (points) {
  this.score += points;
}

Player.prototype.reachedGoal = function () {
  this.scored(200);
  this.respawn();
}

// key handler funcion of the player
Player.prototype.handleInput = function (key) {
  if (!this.isGameOver) {
    switch (key) {
    case "up":
      this.row -= 1;
      break;
    case "down":
      this.row += 1;
      break;
    case "left":
      this.col -= 1;
      break;
    case "right":
      this.col += 1;
      break;
    }
  }

  if (this.row < 0)
    this.row = 0;
  else if (this.row >= rows)
    this.row = rows - 1;
  if (this.col < 0)
    this.col = 0;
  else if (this.col >= cols)
    this.col = cols - 1;

  this.x = this.col * 101;
  this.y = this.row * 83 - 25;
}

var allEnemies = [];
var player = new Player();
var gem = new Gem();

document.addEventListener('keydown', function (e) { // changed to keydown for better gameplay
  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  player.handleInput(allowedKeys[e.keyCode]);
});