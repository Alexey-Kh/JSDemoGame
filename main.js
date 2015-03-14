var lastSelected, mirrorCount = 0, wallCount = 0, laserCount = 0, blocked = false, clearedScene = true, tries = 0;

// *Levels*

var level1 = '\
A====||=======||==Z \
=====||===//==||=== \
=====||=======||=== \
==========||======= \
==========||======= \
=====//===||==//=== \
==========||=======';

// *Functions*

// Parse level string. Return object with width and height of the level, arrays with information about location of lasergun,
// target, walls, mirrors. Objects have information about 'left' and 'top' properties of elements, mirrors also has 'width'
// and 'height' properties. The width and height of 1 element of level is used as an unit of measurement.
// All elements in level string, except mirrors, will be transformed into single element. Mirrors will be concatenated,
// if they are located near each other.
function readLevel(level){
  // Cut level string into array of arrays, consisting of single characters.
  level = level.split(' ');
  for(var i = 0; i < level.length; i++) {
    level[i] = level[i].split('');
  };
  // Count the width and height of level.
  var widthElems = level[0].length;
  var heightElems = level.length;
  // Create empty arrays for elements.
  var mirrors = [], walls = [], laserGuns = [], targets = [];
  // For loop for going through each line.
  for(var i = 0; i < level.length; i++) {
    // For loop for going through each character of the line.
    for (var j = 0; j < level[i].length; j++) {
      // Check for walls. Add in 'walls' array if match.
      if (level[i][j] === '|') {
        walls.push({ left: j, top: i });
      // Check for mirrors. Add in 'mirrors' array if match.
      } else if (level[i][j] === '/') {
        // Width and height of the mirror object.
        var width = 1, height = 1;
        // Variables for stopping while loops.
        var widthStopper = false, heightStopper = false;
        // While loop to get the width of the current mirror object by checking next characters on this level line.
        // If match, replace wall-character with another char, so that mirror object wouldn't be added in 
        // 'mirrors' array again during the 'for' loop.
        while (widthStopper === false) {
          if (level[i][j+width] === '/') {
            level[i][j+width] = '_';            
            width++;
          } else {
            widthStopper = true;
          };
        };
        // While loop to get the height of the current mirror object by checking characters at the same position 
        // under this level line. If match, replace wall-character with another char, so that mirror object wouldn't be
        // added in 'mirrors' array again during the 'for' loop.
        while (heightStopper === false) {
          if (level[i+height][j] === '/') {
            level[i+height][j] = '_';            
            height++;            
          } else {
            heightStopper = true;
          };
        };
        // Add completed mirror into 'mirrors' array.
        mirrors.push({ left: j, top: i, width: width, height: height });        
      // Check for laser guns. Add in 'laserGuns' array if match.
      } else if (level[i][j] === 'A') {
        laserGuns.push({ left: j, top: i });        
      // Check for targets. Add in 'targets' array if match.
      } else if (level[i][j] === 'Z') {
        targets.push({ left: j, top: i });
      };
    };
  };
  return { widthElems: widthElems,
           heightElems: heightElems, 
           walls: walls, 
           mirrors: mirrors, 
           laserGuns: laserGuns, 
           targets: targets };
};
console.log(readLevel(level1)); // todel



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

    return { pageX: pageX, pageY: pageY };
};

// Checks if the point is on the background
function isInWorkArea(x, y) {
  var back = getBoundingPageRect(background);
  var backBrdW = getBorderWidth(background)
  var left = back.left + backBrdW;
  var top = back.top + backBrdW;
  var right = back.right - backBrdW;
  var bottom = back.bottom - backBrdW;
  if (x >= left && x <= right && y >= top && y <= bottom) {
    return true;
  };
  return false;
};

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
        fire(laser.endPointX - getBoundingPageRect(background).left - getBorderWidth(background), 
             laser.endPointY - getBoundingPageRect(background).top - getBorderWidth(background),
             newLaserAngle(laser, laser.endPointElem), laser.endPointElem);
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
};

// Optimize rotation to the angle in range [0...360] degrees
function optimizeRotation(rotation) {
  var optimizedRotation = rotation;
  while (optimizedRotation < 0) { optimizedRotation += 360 };
  while (optimizedRotation >= 360) { optimizedRotation -= 360 };
  return optimizedRotation;
};

// Calculate the coordinates of the rotated point. `pivot' is the origin of the rotation
function rotatedPointCoords(pivot, point, angle) {
  // Rotate clockwise, angle in radians
  var x = (Math.cos(angle) * (point.x - pivot.x)) -
           (Math.sin(angle) * (point.y - pivot.y)) +
           pivot.x;
  var y = (Math.sin(angle) * (point.x - pivot.x)) +
           (Math.cos(angle) * (point.y - pivot.y)) +
           pivot.y;
  return {x: x, y: y};
};

// Return array with coordinates of element's rectangle vertices
function verticesCoords(elem) {
  var elRect = getBoundingPageRect(elem);
  var pivot = {
    x: elRect.left + elRect.width/2,
    y: elRect.top + elRect.height/2
  };
  // Get default width and height of element (with 0 degrees rotation). 
  var defWidth = getWidth(elem);
  var defHeight = getHeight(elem);  
  // Calculate default element's rectangle vertices BEFORE rotation.
  var defV1 = {
    x: pivot.x - defWidth/2,
    y: pivot.y - defHeight/2
  };
  var defV2 = {
    x: pivot.x + defWidth/2,
    y: pivot.y - defHeight/2
  };
  var defV3 = {
    x: pivot.x + defWidth/2,
    y: pivot.y + defHeight/2
  };
  var defV4 = {
    x: pivot.x - defWidth/2,
    y: pivot.y + defHeight/2
  };
  var elRot = elem.rotation;
  // If rotation angle is 0, return array with default vertices
  if (elRot === 0) { return [defV1, defV2, defV3, defV4] };
  // Calculate element's rectangle vertices AFTER rotation.
  var v1 = rotatedPointCoords(pivot, defV1, toRad(elRot));
  var v2 = rotatedPointCoords(pivot, defV2, toRad(elRot));
  var v3 = rotatedPointCoords(pivot, defV3, toRad(elRot));
  var v4 = rotatedPointCoords(pivot, defV4, toRad(elRot));
  return [v1, v2, v3, v4];
};

// Return true if the point x,y is inside the polygon, or false if it is not.
// testP - object with test point coordinates x and y
// polPs - array of objects with polygon points coordinates [{x, y},{..},{..}]
function pointInPolygon(polPs, testP) {
  // Add 5th element polPs[4]===polPs[0] into array, in order to be able to compare ([0] and [3]) pair.
  polPs.push(polPs[0]);
  var c = false;
  for (var i = 0; i < polPs.length - 1; i++) {
    var j = i + 1;
    if ((( polPs[i].y <= testP.y && testP.y < polPs[j].y) || (polPs[j].y <= testP.y && testP.y < polPs[i].y )) &&
      (testP.x > (polPs[j].x - polPs[i].x) * (testP.y - polPs[i].y) / (polPs[j].y - polPs[i].y) + polPs[i].x)) {
      c = !c;
    }
  };
  return c;
};

// Math for getting rotation angle for a new laser to imitate reflection from the mirror
function newLaserAngle(laser, mirror){
  // Determine the side of mirror, the laser has faced.
  // For that purpose use mirror vertices and collision point, where laser has faced the mirror.
  var mirVerts = verticesCoords(mirror);
  // Add 5th element mirVerts[4]===mirVerts[0] into array, in order to be able to compare ([0] and [3]) pair.
  mirVerts.push(mirVerts[0]);
  var colPoint = { x: Math.round(laser.endPointX), y: Math.round(laser.endPointY) };
  for (var i=0; i < 4; i++) {
    // Define math bias as in pixels.
    var bias = 3;
    // toref
    // Create fake polygon using 2 points and bias in order to determine which rectangle side collision point belongs to. 
    if (Math.abs(mirVerts[i].y - mirVerts[i+1].y) < 20) {
      var polygonPoints = [
        { x: mirVerts[i].x, y: mirVerts[i].y + bias },
        { x: mirVerts[i].x, y: mirVerts[i].y - bias },
        { x: mirVerts[i+1].x, y: mirVerts[i+1].y - bias },
        { x: mirVerts[i+1].x, y: mirVerts[i+1].y + bias }
      ];
    } else {
      var polygonPoints = [
        { x: mirVerts[i].x + bias, y: mirVerts[i].y },
        { x: mirVerts[i].x - bias, y: mirVerts[i].y },
        { x: mirVerts[i+1].x - bias, y: mirVerts[i+1].y },
        { x: mirVerts[i+1].x + bias, y: mirVerts[i+1].y }
      ];
    };
    if (pointInPolygon(polygonPoints, colPoint)) {
      // Save vertices, between which the collision point is located. Stop the 'for' loop.
      var rightVerts = [ mirVerts[i], mirVerts[i+1] ];
      // alert('I work!'); // to del
      break;
    };
  };
  // Calculate rotation angle of determined mirror's side, the laser has faced.
  // angle = ABS(x2-x1/y1-y2).
  var mirRot = toDegrees(Math.atan(
                        (rightVerts[1].x - rightVerts[0].x )/ 
                        (rightVerts[0].y - rightVerts[1].y)));
  var newLaserAngle = 2 * mirRot - laser.rotation;
  //alert(newLaserAngle); //todel
  return newLaserAngle;
};

// Elements rotation
function rotate(elem, deg) {
  var defDeg = parseInt(elem.style.transform.slice(7));  
  elem.rotation = defDeg + deg;
  elem.style.transform = 'rotate(' + (defDeg + deg) + 'deg)';
};

// Converts degrees to radians
function toRad(deg) {
  return deg * Math.PI / 180;
};

// Converts radians to degrees 
function toDegrees(rad) {
  return rad * 180 / Math.PI;
};

// Clears the scene, deleting all lasers
function clearScene() {
  // clearedScene is used in order to 
  if (clearedScene) { return false };
  var lasers = document.getElementsByClassName('laser');
  while (lasers[0]) { lasers[0].parentNode.removeChild(lasers[0]) };
  clearedScene = true;
};

// Blocks the scene if true is passed, unblocks if false
function blockScene(boolean) {
  // Cancel any element selection
  if (lastSelected) { lastSelected.style.border = '' };
  // Save information about block/unblock of the scene variable
  blocked = boolean;
  // Switch 'selectable' property of mirrors
  var mirrors = document.getElementsByClassName('mirror');
  for (var i=0; i < mirrors.length; i++) {
    mirrors[i].selectable = !boolean;
  };
  // Switch 'selectable' property of laser gun
  laserGun.selectable = !boolean;
  // Enable/disable drag'n'drop on mirrors
  var draggable = boolean? 'disable': 'enable';
  $('.mirror').draggable( draggable );
};

// Calculate page coordinates of the element bounding rectangle and returns object with left, top, right, bottom properties
function getBoundingPageRect(elem) {
  // If clause check if the required element is the background for optimization purposes. If yes, returns completed object,
  // if this function was already called on background.
  if (elem === background && background.boundingPageRect) { return background.boundingPageRect };
  var clientCoords = elem.getBoundingClientRect();
  var leftTop = toPageCoords(clientCoords.left, clientCoords.top);
  var rightBot = toPageCoords(clientCoords.right, clientCoords.bottom);
  var res = { 
    left: leftTop.pageX, 
    top: leftTop.pageY, 
    right: rightBot.pageX, 
    bottom: rightBot.pageY,
    width: rightBot.pageX - leftTop.pageX,
    height: rightBot.pageY - leftTop.pageY
  };
  // If background, save result as it's property.
  if (elem === background) { background.boundingPageRect = res };
  return res;
};

// Parse style.height of the element and return integer
function getHeight(elem) {
  return parseInt(elem.style.height)
};

// Parse style.width of the element and return integer
function getWidth(elem) {
  return parseInt(elem.style.width) 
};

// Parse style.borderWidth of the element and return integer
function getBorderWidth(elem) {
  return parseInt(elem.style.borderWidth) 
};


// *Objects generators*

// Background creation
function Background() {
  var background = document.createElement('div');
  background.id = 'background';
  background.style.cssText = "width: 900px; \
                              height: 600px;  \
                              border: 2px solid black;"
  return background;
};

// Menu creation
function Menu() {
  var menu = document.createElement('div');
  menu.id = 'menu';
  menu.className = 'menu';
  menu.style.cssText = "width: 300px; \
                        height: " + getHeight(background) + "px; \
                        left: " + getBoundingPageRect(background).right + "px; \
                        top: " + getBoundingPageRect(background).top + "px;";
  return menu;
};

// Button generator
function Button(id, value) {

  var button = document.createElement('input');
  button.id = id;
  button.className = 'button';
  button.type = 'button';
  button.value = value;
  return button;
};

// Lasergun picture
function LaserGun() {
  var laserGun = document.createElement('img');
  laserGun.className = 'lasergun';
  laserGun.rotation = -90;
  laserGun.src = 'assets/lasergun.png';
  var width = 45;  
  // height/width = 1.31
  var height = Math.round(width*1.31);
  var left = (height-width)/2;
  laserGun.style.cssText = "width: " + width + "px; \
                            height: " + height + "px; \
                            left: " + left + "px; \
                            transform: rotate(" + laserGun.rotation + "deg);";
  laserGun.barrelCoords = function() {
    // barrel x coord is located at 42/67 of laser gun width
    var angleRad = toRad(this.rotation);
    var x = width*42/67- width/2;
    var y = height*0.45;
    // get x and y according to rotation angle
    var newX = left + width/2 + x*Math.cos(angleRad) - y*Math.sin(angleRad);
    var newY = height/2 + y*Math.cos(angleRad) + x*Math.sin(angleRad);
    return { x: newX, y: newY };
  };
  laserGun.selectable = true;
  return laserGun;
};

// Target generator
function Target() {
  var target = document.createElement('div');
  target.className = 'target';
  var size = 40;
  target.style.cssText = 'width: ' + size + 'px; \
                          height: ' + size + 'px;';
  target.style.left = (getWidth(background) - size) + 'px';  
  target.style.top = (getHeight(background) - size) + 'px';
  return target;
};

// Mirrors generator
function Mirror(x, y, rotation) {

  var mirror = document.createElement('div');
  mirror.rotation = rotation || 0;
  mirror.style.cssText = "width: 30px; \
                          height: 100px; \
                          transform: rotate(" + mirror.rotation + "deg);";
  mirror.style.left = (x || 0) + 'px';
  mirror.style.top = (y || 0) + 'px';
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
                        transform: rotate(" + wall.rotation + "deg); \
                        transform-origin: 0% 0%;";
  wall.style.left = x + 'px';
  wall.style.top = y + 'px';
  wall.className = 'wall';
  wall.id = 'wall' + (++wallCount);
  return wall;
};

// Lasers generator
function Laser(x, y, rotation) {

  var laser = document.createElement('div');

  // Laser object methods
  laser.increaseHeight = function() {
    this.style.height = (parseInt(this.style.height) + 1) + 'px';
  };

  // Checks if laser faced the mirror or wall
  laser.checkForElement = function(lastMirrorFaced) {
    var rect = this.getBoundingClientRect(), clientX, clientY;
    // Determine the direction of the laser in order to get right coordinates of it's end
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
    // Catch 'Uncaught TypeError: Cannot read property 'className' of undefined', occuring when laser leaves browser client window
    try {
      var elemClass = currentElem.className;
    } catch(e) {
      if (!e instanceof TypeError) { throw e };
      alert("Error! Laser is outside of the client window!"); //todel
      return 'error';
    }
    // Return the string with element name faced, if any
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
  laser.rotation = optimizeRotation(rotation);
  laser.style.cssText = "width: 1px; \
                         height: 0px; \
                         transform: rotate(" + laser.rotation + "deg); \
                         transform-origin: 0% 0%;";
  laser.style.left = x + 'px';
  laser.style.top = y + 'px';
  laser.className = 'laser';
  laser.id = 'laser' + (++laserCount);
  laser.endPointX = getBoundingPageRect(background).left + getBorderWidth(background) + x;
  laser.endPointY = getBoundingPageRect(background).top + getBorderWidth(background) + y;
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

// *Create elements and add them to DOM*

// todel, for test purposes
// for (var i=0;i<3; i++) {
//   var p = document.createElement('p');
//   p.textContent = "this is " + i + " paragraph!";
//   document.body.appendChild(p);
// };

var container = document.createElement('div');
container.className = 'container';
document.body.appendChild(container);

var background = Background();
container.appendChild(background);

var laserGun = LaserGun();
background.appendChild(laserGun);

var target = Target();
background.appendChild(target);

for (var i=1; i<=2; i++) {
  var mirror = new Mirror(i*40,50);
  background.appendChild(mirror);
  // Drag'n'drop using jQuery UI
  $('#mirror'+i).draggable({
    drag: function(event, ui) {
      clearScene();
    }
  });
};

background.appendChild(new Wall(250,0,0));
background.appendChild(new Wall(500,300,0));

var menu = Menu();
container.appendChild(menu);
container.style.height = getHeight(background) + "px";

var menuTitle = document.createElement('h2');
menuTitle.textContent = 'JavaScript Game Demo';
menu.appendChild(menuTitle);

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
triesText.className = 'text-align-center';
triesText.textContent = 'Tries: ' + tries;
menu.appendChild(triesText);

var menuTextDiv = document.createElement('div');
menuTextDiv.innerHTML = "<p>The purpose of this game is to hit the target (red square) using laser gun and mirrors (blue lines). \
The core idea is to use mirrors in order to navigate laser beam in required direction through reflection. \
Laser beam can't penetrate walls (black objects) or reflect from them, so they must be avoided.</p>\
<h3>Controls</h3>\
<ul><li>- Player can drag mirrors using the mouse.</li>\
    <li>- Player can rotate laser gun and mirrors. For that required object must be selected by left mouse click and then rotated\
     with right and left arrow keys on the keyboard.</li>\
    <li>- When mirrors are located and laser gun is pointed, \"Start\" button should be pressed. \"Stop\" button stops the process.</li>\
</ul>";
menu.appendChild(menuTextDiv);

// todel, for test purposes
// for (var i=0;i<3; i++) {
//   var p = document.createElement('p');
//   p.textContent = "this is " + i + " paragraph!";
//   document.body.appendChild(p);
// };