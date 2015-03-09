var lastSelected, mirrorCount = 0, wallCount = 0, laserCount = 0, blocked = false, clearedScene = true, tries = 0;

// todel, for test purposes
for (i=0;i<3; i++) {
  var p = document.createElement('p');
  p.textContent = "this is " + i + " paragraph!";
  document.body.appendChild(p);
};

var container = document.createElement('div');
container.className = 'container';
container.cssText = "";
document.body.appendChild(container);

// Background creation
function Background() {
  var background = document.createElement('div');
  background.id = 'background';
  background.style.cssText = "background-color: #E4E4E4; \
                              width: 900px; \
                              height: 600px; \
                              margin-left: 25px; \
                              z-index: 0; \
                              position: absolute; \
                              display: inline-block; \
                              float: left; \
                              border: 2px solid black;"
  background.getHeight = function () { return parseInt(this.style.height) };
  background.getWidth = function () { return parseInt(this.style.width) };
  background.getBorderWidth = function () { return parseInt(this.style.borderWidth) };
  // Get page coordinates of top and left
  background.getPageCoordsOf = function () {
    var backClientCoords = this.getBoundingClientRect();
    var backLeftTop = toPageCoords(backClientCoords.left, backClientCoords.top);
    var backRightBot = toPageCoords(backClientCoords.right, backClientCoords.bottom);
    return { left: backLeftTop.pageX, top: backLeftTop.pageY, right: backRightBot.pageX, bottom: backRightBot.pageY }
  }
  return background;
}
var background = Background();
container.appendChild(background);

// Menu creation

function Menu() {
  var menu = document.createElement('div');
  menu.id = 'menu';
  menu.style.cssText = "background-color: #E4E4E4; \
                        width: 300px; \
                        height: " + background.getHeight() + "px; \
                        left: " + background.getPageCoordsOf().right + "px; \
                        top: " + background.getPageCoordsOf().top + "px; \
                        margin-left: 5px; \
                        z-index: 0; \
                        position: absolute; \
                        display: inline-block; \
                        border: 1px solid black; \
                        border-radius: 5px; \
                        text-align: center;";
  return menu;
}
var menu = Menu();
container.appendChild(menu);
container.style.height = background.getHeight() + "px";

// Button generator
function Button(id, value) {

  var button = document.createElement('input');
  button.id = id;
  button.type = 'button';
  button.value = value;
  button.style.cssText = "border: 1px solid black; \
                          border-radius: 5px; \
                          text-align: center; \
                          font-size: 1em;";
  return button;
}
var startButton = Button('start-button', 'Start')
startButton.onclick = function(){
  if (blocked) { return false};
  blockScene(true);
  tries++;
  triesText.textContent = 'Tries: ' + tries;
  clearScene();
  fire(laserGun.barrelCoords().x, laserGun.barrelCoords().y, laserGun.rotation);
};
menu.appendChild(startButton);

var stopButton = Button('stop-button', 'Stop');
stopButton.onclick = function(){
  clearScene();
};
menu.appendChild(stopButton);

var triesText = document.createElement('p');
triesText.textContent = 'Tries: ' + tries;
menu.appendChild(triesText);

// Lasergun picture
function LaserGun() {
  var laserGun = document.createElement('img');
  laserGun.className = 'lasergun';
  laserGun.rotation = -90;
  laserGun.src = 'assets/lasergun.png';
  var width = 45;  
  // height/width = 1.31
  var height = width*1.31;
  var left = (height-width)/2;
  laserGun.style.cssText = "width: " + width + "px; \
                            height: " + height + "px; \
                            left: " + left + "px; \
                            position: absolute; \
                            transform: rotate(" + laserGun.rotation + "deg);";
  laserGun.barrelCoords = function() {
    // barrel x coord is located at 42/67 of laser gun width
    var angleRad = toRad(this.rotation);
    // var x = width*42/67 + left;
    // var y = height*0.95;
    // // get x and y according to rotation angle
    // var newX = x*Math.cos(angleRad) - y*Math.sin(angleRad);
    // var newY = y*Math.cos(angleRad) - x*Math.sin(angleRad);

    var x = width*42/67- width/2;
    var y = height*0.45;
    var newX = left + width/2 + x*Math.cos(angleRad) - y*Math.sin(angleRad);
    var newY = height/2 + y*Math.cos(angleRad) + x*Math.sin(angleRad);
    return { x: newX, y: newY };
  };
  laserGun.selectable = true;
  return laserGun;
}
var laserGun = LaserGun();
background.appendChild(laserGun);

// Target generator
function Target() {
  var target = document.createElement('div');
  target.className = 'target';
  var size = 40;
  target.style.cssText = 'width: ' + size + 'px; \
                          height: ' + size + 'px; \
                          position: absolute; \
                          z-index: 50; \
                          background-color: red;'
  target.style.left = background.getWidth() - size;  
  target.style.top = background.getHeight() - size;
  return target;
}

var target = Target();
background.appendChild(target);

// *Functions*

// Transforms client coordinates to page coordinates

function toPageCoords(clientX, clientY) {
    var body = document.body;
    var docElem = document.documentElement;

    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;

    var pageY = clientY + scrollTop - clientTop;
    var pageX = clientX + scrollLeft - clientLeft;

    return { pageX: Math.round(pageX), pageY: Math.round(pageY) };
}

// function isChildOf(parent, child) {
//   var node = child.parentNode;
//   while (node !== null) {
//     if (node === parent) {
//       return true;
//     }
//     node = node.parentNode;
//   }
//   return false;
// };

// Checks if the point is on the background
function isInWorkArea(x, y) {
  var back = background.getPageCoordsOf();
  var left = back.left + background.getBorderWidth();
  var top = back.top + background.getBorderWidth();
  var right = back.right - background.getBorderWidth();
  var bottom = back.bottom - background.getBorderWidth();
  if (x >= left && x <= right && y >= top && y <= bottom) {
    return true;
  }
  return false;
}

// Launches the process of drawing lasers
function fire(x, y, deg, lastMirrorFaced) {
  clearedScene = false;
  lastMirrorFaced = lastMirrorFaced || null;
  var laser = new Laser(x, y, deg);
  background.appendChild(laser);
  var laserDrawer = function(laser, lastMirrorFaced) {
    // Checks whether laser is on the background or not, stops drawing if not
    if (!isInWorkArea(laser.endPointX, laser.endPointY)) { 
      // alert("Point is outside of the background"); // todel
      blockScene(false);
      return false;
    };
    laser.increaseHeight();
    // Checks if mirror was faced. If yes, starts drawing new laser. If no, continues drawing current laser.
    switch (laser.checkForElement(lastMirrorFaced)) {
      case false:
        window.setTimeout(laserDrawer, 5, laser, lastMirrorFaced);
        break;
      case 'mirror':
        fire(laser.endPointX - background.getPageCoordsOf().left - background.getBorderWidth(), 
             laser.endPointY - background.getPageCoordsOf().top - background.getBorderWidth(),
             getNewLaserAngle(laser.rotation, laser.endPointElem.rotation), laser.endPointElem);
        break;
      case 'target':
        alert("You've hit the target on " + tries + " try!"); //todel   
        tries = 0;     
        blockScene(false);
        break;
      case 'error':              
        blockScene(false);
        clearScene();
        break;
      default:      
        blockScene(false);
    };
  };
  window.setTimeout(laserDrawer, 0, laser, lastMirrorFaced);
}

// Math for getting rotation angle for a new laser to imitate reflection from the mirror
function getNewLaserAngle(laserRotationAngle, mirrorRotationAngle){
  return newLaserAngle = 2*mirrorRotationAngle - laserRotationAngle;
}

// Elements rotation
function rotate(elem, deg) {
  var defDeg = parseInt(elem.style.transform.slice(7));  
  elem.rotation = defDeg + deg;
  elem.style.transform = 'rotate(' + (defDeg + deg) + 'deg)';
}

// Converts degrees to radians
function toRad(deg) {
  return deg*Math.PI/180;
};

// Clears the scene, deleting all lasers
function clearScene() {
  // clearedScene is used in order to 
  if (clearedScene) { return false };
  var lasers = document.getElementsByClassName('laser');
  while (lasers[0]) { lasers[0].parentNode.removeChild(lasers[0]) };
  clearedScene = true;
}

// Blocks the scene if true is passed, unblocks if false
function blockScene(boolean) {

  if (lastSelected) { lastSelected.style.border = '' };
  blocked = boolean;

  var mirrors = document.getElementsByClassName('mirror');
  for (i=0; i < mirrors.length; i++) {
    mirrors[i].selectable = !boolean;
  }

  laserGun.selectable = !boolean;

  var draggable = boolean? 'disable': 'enable';
  $('.mirror').draggable( draggable );

}

// *Objects generators*

// Mirrors generator

function Mirror(x, y, rotation) {

  var mirror = document.createElement('div');
  mirror.rotation = rotation || 0;
  mirror.style.cssText = "width: 3px; \
                          height: 200px; \
                          background-color: blue; \
                          position: absolute; \
                          transform: rotate(" + mirror.rotation + "deg); \
                          z-index: 20;";
  mirror.style.left = x || 0;
  mirror.style.top = y || 0;
  mirror.className = 'mirror';
  mirror.id = 'mirror' + (++mirrorCount);
  mirror.selectable = true;
  return mirror;
};

// Walls generator

function Wall(x, y, rotation, width, height) {

  var wall = document.createElement('div');
  wall.rotation = rotation;
  wall.style.cssText = "width: " + (width || 5) + "px; \
                        height: " + (height || 300) + "px; \
                        background-color: black; \
                        position: absolute; \
                        transform: rotate(" + mirror.rotation + "deg); \
                        transform-origin: 0% 0%; \
                        z-index: 30;";
  wall.style.left = x;
  wall.style.top = y;
  wall.className = 'wall';
  wall.id = 'wall' + (++wallCount);
  wall.selectable = true;
  return wall;
};

for (i=1; i<=4; i++) {
  var mirror = new Mirror;
  background.appendChild(mirror);
  // Drag'n'drop using jQuery UI
  $('#mirror'+i).draggable({
    drag: function(event, ui) {
      clearScene();
    }
  });
};
background.appendChild(new Wall(250,0,90));
background.appendChild(new Wall(500,300,0));

// Lasers generator

function Laser(x, y, rotation) {

  var laser = document.createElement('div');

  // Laser object methods
  laser.increaseHeight = function() {
    this.style.height = (parseInt(this.style.height) + 1) + 'px';
  };

  // Optimize rotation to the angle in range [0...360] degrees
  laser.optimizeRotation = function(rotation) {
    var optimizedRotation = rotation;
    while (optimizedRotation < 0) { optimizedRotation += 360 };
    while (optimizedRotation >= 360) { optimizedRotation -= 360 };
    return optimizedRotation;
  };

  // Checks if laser faced the mirror or wall
  laser.checkForElement = function(lastMirrorFaced) {
    var rect = this.getBoundingClientRect(), clientX, clientY;
    // Defines the direction of the laser in order to get coordinates of it's end
    var rot = this.rotation;
    var halfWidth = parseInt(this.style.width)/2;
    if (rot > 0 && rot < 90) {
      clientX = rect.left;
      clientY = rect.bottom;
    } else if (rot > 90 && rot < 180) {
      clientX = rect.left;
      clientY = rect.top;
    } else if (rot > 180 && rot < 270) {
      clientX = rect.right;
      clientY = rect.top;
    } else if (rot > 270 && rot < 360) {
      clientX = rect.right;
      clientY = rect.bottom;
    } else if (rot === 0) {
      clientX = rect.left + halfWidth;
      clientY = rect.bottom;
    } else if (rot === 90) {
      clientX = rect.left;
      clientY = rect.top + halfWidth;
    } else if (rot === 180) {
      clientX = rect.left - halfWidth;
      clientY = rect.top;
    } else if (rot === 270) {
      clientX = rect.right;
      clientY = rect.top - halfWidth;
    }
    var currentElem = this.endPointElem = document.elementFromPoint(clientX, clientY);
    var endCoords = toPageCoords(clientX, clientY);
    this.endPointX = endCoords.pageX;
    this.endPointY = endCoords.pageY;
    try {
      var elemClass = currentElem.className;
    } catch(e) {
      if (!e instanceof TypeError) { throw e };
      alert("Error! Laser is outside of the client window!"); //todel
      return 'error';
    }
    if ((elemClass.search('mirror') > -1) && ( lastMirrorFaced !== currentElem )) {
      //alert(lastMirrorFaced + " " + currentElem); // todel
      return 'mirror';
    } else if (elemClass.search('wall') > -1) {
      return 'wall';
    } else if (elemClass.search('target') > -1) {
      return 'target';
    } else {
      return false;
    }
  };

  // Laser object attributes
  laser.rotation = laser.optimizeRotation(rotation);
  laser.style.cssText = "width: 1px; \
                        height: 0px; \
                        background-color: green; \
                        position: absolute; \
                        transform: rotate(" + laser.rotation + "deg); \
                        transform-origin: 0% 0%; \
                        z-index: 10;";
  laser.style.left = x;
  laser.style.top = y;
  laser.className = 'laser';
  laser.id = 'laser' + (++laserCount);
  laser.endPointX = background.getPageCoordsOf().left + background.getBorderWidth() + x;
  laser.endPointY = background.getPageCoordsOf().top + background.getBorderWidth() + y;
  laser.endPointElem = null;

  return laser;
};

// *Events*

// Mirror rotation event
document.onkeydown = function(e) {
  event = e || window.e;
  if (lastSelected) {
    clearScene();
    if (event.keyCode === 39) {
      rotate(lastSelected, 2);
    }
    if (event.keyCode === 37) {
      rotate(lastSelected, -2);
    }
  };
};

// Selects the mirror on click and sets borders. Deletes borders by clicking on another element
document.onclick = function(e) {
  event = e || window.e;
  var elem = event.target;
  if (lastSelected) { lastSelected.style.border = '' };
  if (elem.selectable) {    
    clearScene();
    elem.style.border = "1px dashed black";
    lastSelected = elem;
  } else {
    lastSelected = '';
  }
};




// todel, for test purposes
for (i=0;i<3; i++) {
  var p = document.createElement('p');
  p.textContent = "this is " + i + " paragraph!";
  document.body.appendChild(p);
};