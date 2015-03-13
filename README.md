# JavaScript Game Demo

The purpose of this game is to hit the target (red square) using laser gun and mirrors (blue lines). The core idea is to use mirrors in order to navigate laser beam in required direction through reflection. Laser beam can't penetrate walls (black objects) or reflect from them, so they must be avoided.
The game counts tries before hitting the target, so players could compete.

## Controls

 - Player can drag mirrors using the mouse.
 - Player can rotate laser gun and mirrors. For that required object must be selected by left mouse click and then rotated with right and left arrow keys on the keyboard.
 - When mirrors are located and laser gun is pointed, "Start" button should be pressed. "Stop" button stops the process.

## How to install

Copy the files into single directory and open main.html in browser.

## Used tools

The core of the game was created using pure JavaScript on purpose.
In current version jQuery and jQuery UI are used only for drag'n'drop funcion and are expected to be replaced with own code.

## Cross-browser compatibility

There were no aim to achieve cross-browser compatibility. The game was tested only in Google Chrome 40.0.2214 and Mozilla Firefox 33.0.3.

## Current bugs

 - Game scene must fit in the browser window when start button was pressed.
 - Dragging objects using jQuery UI doesn't work perfectly.

## To do

 - Remove bugs.
 - Write own drag'n'drop function.
 - Create game level designer.
 - Polish view.
 - Improve JS code structure.

