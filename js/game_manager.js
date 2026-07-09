

var GameManager = function() {
  this.init();
  this.setup();
  this.start();
}

// Initial game settings
GameManager.prototype.init = function () {
  this.score = 0;
  this.loss = 0;
  this.over = false;
  this.won = false;

  this.count = 4;
  this.level = 1;
  this.speed = 800;
  this.interval = this.speed*2.5;
  this.point = 1;

  this.chickens = {};
  this.eggs = {};

  this.gameTimer;

  this.basketStartPosition = { x: 0, y: 1 };
    this.sounds = [
    new Audio('sound/dai.wav'),
    new Audio('sound/dai2.wav'),
    new Audio('sound/dai3.wav'),
    new Audio('sound/dai4.wav')
  ];
  this.soundCatch = new Audio('sound/ples.wav');
  this.soundFail = new Audio('sound/fail.mp3');
  this.soundLose = new Audio('sound/hru.mp3');
  this.paused = false;
  
};

// Set up the game
GameManager.prototype.setup = function () {
  this.keyboard = new KeyboardInputManager();
  this.keyboard.on("move", this.move.bind(this));

  this.grid = new Grid(this.count);
  this.basket = new Basket(this.basketStartPosition);

  for (var i = 0; i < this.count; i++) {
    this.chickens[i] = new Chicken(i, this.grid.list[i], this.point);
  }

  this.HTMLredraw = new HTMLredraw();

  this.touchscreenModification();
    this.resize();

    var self = this;

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() { self.resize(); });
        window.visualViewport.addEventListener('scroll', function() { self.resize(); });
    } else {
        window.addEventListener('resize', function() { self.resize(); });
    }
    window.addEventListener('orientationchange', function() {
        setTimeout(function() { self.resize(); }, 300);
    });
};

GameManager.prototype.isMobile = function() {
  try {
    document.createEvent("TouchEvent");
    return true;
  }
  catch(e) {
    return false;
  }
};

GameManager.prototype.move = function (data) {
  var position = { x: this.basket.x, y: this.basket.y };

  switch (data.type) {
    case 'arrow':
      // 0: up, 1: right, 2: down, 3: left, 4: R - restart
      if(data.key%2 == 0) {
        position.y = (data.key > 0) ? 0 : 1;
      } else {
        position.x = (data.key > 2) ? 0 : 1;
      }
      break;
    case 'button':
      position.x = data.x;
      position.y = data.y;
      break;
    case 'common':
      if (data.key == 'restart') {
        this.reStart();
        return false;
      }
      break;
  }

  this.basket.updatePosition(position, this.api.bind(this));
}

GameManager.prototype.start = function () {
  this.runGear();
};

GameManager.prototype.reStart = function () {
  window.location.reload();
};

GameManager.prototype.runGear = function () {
    console.log('runGear: called, gameTimer =', this.gameTimer);
    var self = this;
    if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
    }
    this.gameTimer = setInterval(function() {
        console.log('runGear: interval tick, paused =', self.paused, 'over =', self.over);
        if (self.paused || self.over) {
            console.log('runGear: skipping due to paused/over');
            return;
        }
        var chicken = self.findAvailableChicken();
        console.log('runGear: findAvailableChicken returned', chicken);
        if (chicken >= 0) {
            self.runEgg(chicken);
        }
    }, this.interval);
    console.log('runGear: new timer set, id =', this.gameTimer);
};

GameManager.prototype.suspendGear = function () {
  clearInterval(this.gameTimer);
  this.runGear();
};

GameManager.prototype.haltGear = function () {
  clearInterval(this.gameTimer);
  this.over = true;
};

GameManager.prototype.upLevel = function () {
  this.level++;

  switch (true) {
    case (this.level < 8):
      this.speed += -50;
      break;
    case (this.level > 19):
      this.speed += 0;
      break;
    default:
      this.speed += -25;
      break;
  }
  this.interval = this.speed*2.5;

  this.suspendGear();
};

GameManager.prototype.resize = function() {
    var gameWrap = document.getElementById('game-wrap');
    if (!gameWrap) return;

    var origWidth = 572;
    var origHeight = 350;
    var viewport = window.visualViewport || window;
    var winWidth = viewport.width;
    var winHeight = viewport.height;
    var scaleX = winWidth / origWidth;
    var scaleY = winHeight / origHeight;
    var scale = Math.min(scaleX, scaleY, 1); 
    gameWrap.style.transform = '';
    gameWrap.style.margin = '0';
    gameWrap.style.position = 'absolute';
    gameWrap.style.left = '50%';
    gameWrap.style.top = '50%';
    gameWrap.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    gameWrap.style.transformOrigin = 'center center';
};

GameManager.prototype.updateScore = function (data) {
    if (this.grid.list[data.egg].x == this.basket.x && this.grid.list[data.egg].y == this.basket.y) {
        this.score += this.point;
        this.HTMLredraw.updateScore({ value: this.score });
        this.soundCatch.currentTime = 0;
        this.soundCatch.play().catch(() => {});
        if (this.score >= 1000) { this.gameWin(); return false; }
        if (!(this.score % 50)) { this.upLevel(); }
    } else {
        this.loss++;
        this.HTMLredraw.updateLossCount({ loss: this.loss });
        this.soundFail.currentTime = 0;
        this.soundFail.play().catch(() => {});
        if (this.loss > 2) {
            this.gameOver();
        } else {
            this.handleDrop(data);
        }
    }
};

GameManager.prototype.resetAllEggs = function() {
    for (var i = 0; i < this.count; i++) {
        var chicken = this.chickens[i];
        if (chicken.egg) {
            chicken.egg.stop();       
            chicken.egg.step = 0;     
            this.HTMLredraw.updateEggPosition({
                egg: i,
                position: 0
            });
        }
        delete this.grid.hold[i];
    }
    this.grid.hold = [];
};


GameManager.prototype.handleDrop = function(data) {
    if (this.over || this.paused) return;
    this.paused = true;
    if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
    }
    this.resetAllEggs();
    var self = this;
    setTimeout(function() {
        if (self.over) {
            self.paused = false;
            return;
        }
        self.paused = false;
        self.grid.hold = [];
        self.runGear();
    }, 2000);
};

GameManager.prototype.findAvailableChicken = function() {
    var avail = this.grid.avail.diff(this.grid.hold);
    console.log('findAvailableChicken: avail =', avail, 'hold =', this.grid.hold);
    if (!avail) {
        console.log('findAvailableChicken: no available chickens');
        return null;
    }
    var chicken = avail.randomElement();
    this.api('onHoldChicken', { egg: chicken });
    console.log('findAvailableChicken: chosen chicken =', chicken);
    return chicken;
};


GameManager.prototype.runEgg = function(chicken) {
    if (!this.chickens[chicken].egg) {
        var pos = this.grid.list[chicken];
        this.chickens[chicken].egg = new Egg(pos.x, pos.y, this.point);
    }
    this.chickens[chicken].egg.run(this.speed, this.api.bind(this));
};

GameManager.prototype.gameOver = function() {
    this.haltGear(); 
    for (var i = 0; i < this.count; i++) {
        var chicken = this.chickens[i];
        if (chicken.egg && chicken.egg.stop) {
            chicken.egg.stop();
        }
    }

    this.paused = false;
	this.soundLose.currentTime = 0;
    this.soundLose.play().catch(function(e) {});
    this.HTMLredraw.gameOver();
};

GameManager.prototype.gameWin = function() {
    this.haltGear();
    for (var i = 0; i < this.count; i++) {
        var chicken = this.chickens[i];
        if (chicken.egg && chicken.egg.stop) {
            chicken.egg.stop();
        }
    }

    var video = document.getElementById('winVideo');
    if (video) {
        video.style.display = 'block';
        video.play().catch(function(e) {
            console.log('Автовоспроизведение заблокировано, нажмите кнопку Play на видео');
        });
        video.addEventListener('ended', function() {
            if (confirm('Хотите сыграть ещё раз?')) {
                location.reload();
            }
        });
        video.onerror = function() {
            console.error('Не удалось загрузить видео. Проверьте путь к файлу.');
        };
    } else {
        console.warn('Элемент #winVideo не найден в HTML.');
        this.HTMLredraw.gameWin();
    }

    var gameWrap = document.getElementById('game-wrap');
    if (gameWrap) gameWrap.style.opacity = '0.3';
};

GameManager.prototype.api = function(method, data) {
  switch (method) {
	  
    case 'updateScore':
      this.updateScore(data);
      break;
    case 'onHoldChicken':
      this.grid.onHold(data.egg);
      break;
    case 'unHoldChicken':
      this.grid.unHold(data.egg);
      break;
    case 'updateEggPosition':
    this.HTMLredraw.updateEggPosition(data);
    if (data.position > 0 && this.sounds[data.egg]) {
        this.sounds[data.egg].currentTime = 0;
        this.sounds[data.egg].play().catch(function(e) {
        });
    }
    break;
    case 'updateBasketPosition':
      this.HTMLredraw.updateBasketPosition(data);
      break;
	  
  }
};

GameManager.prototype.touchscreenModification = function() {
    var self = this;
    var buttons = document.querySelector('#controls').getElementsByTagName('a');
    var restartBtn = document.querySelector('.restart-game');
    if (restartBtn) {
        restartBtn.onclick = function() {
            self.move({ type: 'common', key: 'restart' });
            return false;
        };
    }
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].onclick = function() {
            var data = { x: this.getAttribute('data-x'), y: this.getAttribute('data-y'), type: 'button' };
            self.move(data);
            return false;
        };
    }
    this.HTMLredraw.mobileVersion();
};
