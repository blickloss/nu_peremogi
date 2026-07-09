

function HTMLredraw() {
  this.bodyWrap = document.querySelector('body');
  this.gameWrap = document.querySelector('#game-wrap');
  this.scoreWrap = document.querySelector('#score');
  this.messageWrap = document.querySelector('#message');
  this.scoreNums = 4;
}

HTMLredraw.prototype.updateEggPosition = function(data) {
    // data.egg - индекс яйца (0..3), data.position - шаг (0..5)
    this.gameWrap.setAttribute('data-egg-' + data.egg, data.position);
};

HTMLredraw.prototype.updateBasketPosition = function(data) {
  this.changeAttributesValue(['data-bx', 'data-by'], [data.x, data.y]);
};

HTMLredraw.prototype.changeAttributesValue = function(attributes, values) {
  if (attributes instanceof Array && values instanceof Array && attributes.length == values.length) {
    for (var i = 0; i < attributes.length; i++) {
      this.gameWrap.setAttribute(attributes[i], values[i]);
    }
  }
};

HTMLredraw.prototype.updateScore = function(data) {
  var elements = this.scoreWrap.getElementsByTagName('li');
  var score = data.value.toString();
  var empty = (this.scoreNums - score.length);

  for (var i = 0; i < elements.length; i++) {
    var num = (i < empty) ? 0 : parseInt(score.charAt(i - empty));
    elements[i].className = 'n-' + num;
  }
};

HTMLredraw.prototype.updateLossCount = function(data) {
  this.changeAttributesValue(['data-loss'], [data.loss]);
};

HTMLredraw.prototype.gameOver = function() {
  var msg = this.getMessage('ЗРАДА!');

  this.messageWrap.show();
  this.messageWrap.appendChild(msg);
};

HTMLredraw.prototype.gameWin = function() {
  var msg = this.getMessage('You\'ve Won!');

  this.messageWrap.show();
  this.messageWrap.appendChild(msg);
};

HTMLredraw.prototype.getMessage = function(message) {
  var data = { h3: message, p: 'Коллектуй <b>бiльше</b> грошив' };

  var wrap = document.createElement('div');
  for (var tag in data) {
    var elem = document.createElement(tag);
    elem.innerHTML = data[tag];
    wrap.appendChild(elem);
  }

  return wrap;
};

HTMLredraw.prototype.resetEggs = function() {
  // Например, если яйца отображаются как элементы с классом 'egg',
  // можно удалить их все:
  var eggs = document.querySelectorAll('.egg');
  for (var i = 0; i < eggs.length; i++) {
    eggs[i].parentNode.removeChild(eggs[i]);
  }
  // Или сбросить позиции в сетке, если они хранятся в данных
};

HTMLredraw.prototype.updateLossWithBlink = function(lossCount, blinkIndex) {
  // Используем существующий контейнер #loss
  var container = document.getElementById('loss');
  if (!container) return;

  // Очищаем контейнер
  container.innerHTML = '';

  // Для каждой жизни создаём иконку
  for (var i = 0; i < lossCount; i++) {
    var icon = document.createElement('span');
    icon.className = 'loss-icon';

    // Если это текущая мигающая иконка (последняя потеря)
    if (i === blinkIndex) {
      icon.classList.add('blink');
    }

    // Вставляем картинку – два способа на выбор:

    // СПОСОБ 1: Использовать <img> (простой и надёжный)
    var img = document.createElement('img');
    icon.appendChild(img);

    // СПОСОБ 2: Установить фон через CSS (если предпочитаете)
    // icon.style.backgroundImage = "url('img/your-icon.png')";
    // icon.style.backgroundSize = 'contain';
    // icon.style.backgroundRepeat = 'no-repeat';
    // icon.style.backgroundPosition = 'center';

    container.appendChild(icon);
  }
};

HTMLredraw.prototype.mobileVersion = function() {
  this.bodyWrap.className = 'is-mobile';
};
