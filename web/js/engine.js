/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */
(function (global) {
  /* Predefine the variables we'll be using within this scope,
   * create the canvas element, grab the 2D context for that canvas
   * set the canvas elements height/width and add it to the DOM.
   */
  var doc = global.document,
    win = global.window,
    canvas = doc.createElement('canvas'),
    ctx = canvas.getContext('2d'),
    lastTime;

  canvas.width = 505;
  canvas.height = 606;
  doc.body.appendChild(canvas);

  /* This function does some initial setup that should only occur once,
   * particularly setting the lastTime variable that is required for the
   * game loop.
   */
  function init() {
    restart();
    lastTime = Date.now();
    player.onLevelUp(function () {
      this.showLevelUp = true;
      game.nextLevel();
      Enemy.prototype.setPossibleRows(game.level.getStoneRowsIndizes());
      setTimeout(function (engine) {
        engine.showLevelUp = false;
      }, 2 * 1000, this);
    })
    main();
  }

  function restart() {
    globalSpeedMultiplyer = 15; // total game Speed
    individualSpeedBooster = 1;
    Enemy.prototype.setPossibleRows(game.level.getStoneRowsIndizes());
    allEntities = [new Enemy(), new Enemy(), new Enemy(), gem, goal, player];

    allEntities.forEach(function (entitiy) {
      entitiy.restart();
    });

    setInterval(addEnemy, 10 * 1000); // add enemies every 10 seconds
  }

  /* This function serves as the kickoff point for the game loop itself
   * and handles properly calling the update and render methods.
   */
  function main() {
    /* Get our time delta information which is required if your game
     * requires smooth animation. Because everyone's computer processes
     * instructions at different speeds we need a constant value that
     * would be the same for everyone (regardless of how fast their
     * computer is) - hurray time!
     */
    var now = Date.now(),
      dt = (now - lastTime) / 1000.0;

    /* Call our update/render functions, pass along the time delta to
     * our update function since it may be used for smooth animation.
     */
    update(dt);
    render();

    // check game status
    checkGameStatus();

    /* Set our lastTime variable which is used to determine the time delta
     * for the next time this function is called.
     */
    lastTime = now;

    /* Use the browser's requestAnimationFrame function to call this
     * function again as soon as the browser is able to draw another frame.
     */
    win.requestAnimationFrame(main);
  };

  /* This function is called by main (our game loop) and itself calls all
   * of the functions which may need to update entity's data. Based on how
   * you implement your collision detection (when two entities occupy the
   * same space, for instance when your character should die), you may find
   * the need to add an additional function call here. For now, we've left
   * it commented out - you may or may not want to implement this
   * functionality this way (you could just implement collision detection
   * on the entities themselves within your app.js file).
   */
  function update(dt) {
    updateEntities(dt);
  }

  /* This is called by the update function  and loops through all of the
   * objects within your allEnemies array as defined in app.js and calls
   * their update() methods. It will then call the update function for your
   * player object. These update methods should focus purely on updating
   * the data/properties related to  the object. Do your drawing in your
   * render methods.
   */
  function updateEntities(dt) {
    allEntities.forEach(function (entitiy) {
      entitiy.update(dt);
    });
  }

  function addEnemy() {
    allEntities.unshift(new Enemy()); // add enemy at the beginning of the Entities array;
  }

  // check the game status (happens after update and render)
  function checkGameStatus() {

    // check if an entity touches the player
    allEntities.forEach(function (entity) {
      if (entity.touchesPlayer(player)) {
        entity.hitPlayer(player);

        // when the player reaches the goal
        if (entity instanceof Goal) {
          globalSpeedMultiplyer += 1; // increase difficulty
        }
      }
    });

    // check if the game is over and stop enemies
    if (isGameOver()) {
      allEntities.forEach(function (entity) {
        entity.deactivate();
      });
    }
  }

  function isGameOver() {
    return player.lives == 0;
  }

  /* This function initially draws the "game level", it will then call
   * the renderEntities function. Remember, this function is called every
   * game tick (or loop of the game engine) because that's how games work -
   * they are flipbooks creating the illusion of animation but in reality
   * they are just drawing the entire screen over and over.
   */
  function render() {

    ctx.fillStyle = "white"; // repaint the canvas in white to prevent artifacts;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    game.render();

    // render score:
    ctx.fillStyle = "black";
    ctx.font = "30px Open Sans";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + player.score, 10, 36);

    // render lives:
    var img = Resources.get(player.sprite);
    ctx.drawImage(img, canvasWidth - img.width * 0.4, -15, img.width * 0.4, img.height * 0.4);
    ctx.textAlign = "right";
    ctx.fillText("" + player.lives, canvasWidth - img.width * 0.4 - 10, 36);

    renderEntities();

    if (this.showLevelUp) {
      ctx.fillStyle = "#2c2c2c";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "white";

      ctx.font = "60px Open Sans";
      ctx.textAlign = "center";
      ctx.strokeText("Level Up", canvasWidth / 2, canvasHeight / 2); // white stroke border of the text
      ctx.fillText("Level Up", canvasWidth / 2, canvasHeight / 2); // black fill text      
    }

    // render Game Over
    if (isGameOver()) {
      ctx.fillStyle = "#2c2c2c";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "white";

      ctx.font = "60px Open Sans";
      ctx.textAlign = "center";
      ctx.strokeText("GAME OVER", canvasWidth / 2, canvasHeight / 2); // white stroke border of the text
      ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2); // black fill text
    }
  }

  /* This function is called by the render function and is called on each game
   * tick. It's purpose is to then call the render functions you have defined
   * on your enemy and player entities within app.js
   */
  function renderEntities() {
    allEntities.forEach(function (entity) {
      entity.render();
    });
  }

  document.addEventListener('keydown', function (e) { // changed to keydown for better gameplay
    var allowedKeys = {
      13: 'restart', // entire
      27: 'restart', // escape
      32: 'restart' // space
        /*    37: 'restart', // left
              38: 'restart', // up
              39: 'restart', // right
              40: 'restart' // down*/
    }
    if (isGameOver() && allowedKeys[e.keyCode] == "restart") {
      Engine.restart();
    }
  });

  document.addEventListener('keydown', function (e) { // changed to keydown for better gameplay
    var allowedKeys = {
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down'
    };

    switch (allowedKeys[e.keyCode]) {
    case "up":
      player.move(0, -1);
      break;
    case "down":
      player.move(0, 1);
      break;
    case "left":
      player.move(-1, 0);
      break;
    case "right":
      player.move(1, 0);
      break;
    }
  });

  /* Go ahead and load all of the images we know we're going to need to
   * draw our game level. Then set init as the callback method, so that when
   * all of these images are properly loaded our game will start.
   */
  Resources.load([
    'images/stone-block.png',
    'images/water-block.png',
    'images/grass-block.png',
    'images/enemy-bug.png',
    'images/char-boy.png',
    'images/char-cat-girl.png',
    'images/char-horn-girl.png',
    'images/char-pink-girl.png',
    'images/char-princess-girl.png',
    'images/gem-blue.png',
  ]);
  Resources.onReady(init);

  /* Assign the canvas' context object to the global variable (the window
   * object when run in a browser) so that developer's can use it more easily
   * from within their app.js files.
   */
  global.ctx = ctx;

  // this is needed in order to make the Engine accessible globally. (especially for the Key Event Listener)
  global.Engine = {
    init: init,
    restart: restart
  };

})(this);