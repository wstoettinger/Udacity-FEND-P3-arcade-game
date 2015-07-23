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
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

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

Enemy.prototype.touchesPlayer = function (player) {
  if (this.row != player.row)
    return false;
  if (this.x > player.x - colWidth * 0.75 && this.x < player.x + colWidth * 0.75)
    return true;
  return false;
}

Enemy.prototype.stop = function () {
  this.speed = 0;
}

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

var Player = function () {
  this.sprite = 'images/char-boy.png';
}

Player.prototype.reset = function () {
  this.respawn();
  this.score = 0;
  this.lives = 3;
  this.isGameOver = false;
}

Player.prototype.respawn = function () {
  this.row = 5; // starting position
  this.col = 2;

  this.x = this.col * colWidth;
  this.y = this.row * rowHeight + heightAdjustment;
}

Player.prototype.update = function (dt) {
  // noop
}

Player.prototype.render = function () {
  var img = Resources.get(this.sprite);
  ctx.drawImage(img, this.x, this.y);

  // render score:
  ctx.fillStyle = "black";
  ctx.font = "30px Open Sans";
  ctx.fillText("Score: " + player.score, 10, 36);

  // render lives:
  ctx.drawImage(img, canvasWidth - img.width * 0.4, -15, img.width * 0.4, img.height * 0.4);
  ctx.fillText("" + player.lives, canvasWidth - img.width * 0.4 - 30, 36);

  // draw Game Over
  if (this.isGameOver) {
    ctx.fillStyle = "#2c2c2c";
    ctx.font = "60px Open Sans";
    ctx.fillText("GAME OVER", canvasWidth / 2 - 100, canvasHeight / 2 - 20);
  }
}

Player.prototype.hit = function () {
  this.lives -= 1;
  this.score -= 100;

  if (this.lives == 0)
    this.isGameOver = true;
  else
    this.respawn();
}

Player.prototype.scored = function (points) {
  this.score += 200;
  this.respawn();
}

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
    case "changeChar":

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

document.addEventListener('keydown', function (e) { // changed to keydown for better gameplay
  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    46: 'changeChar',
  };
  player.handleInput(allowedKeys[e.keyCode]);
});