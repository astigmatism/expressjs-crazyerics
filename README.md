expressjs-crazyerics
=====

buliding the application
__________________

Gulp.

I prefer Gulp to Grunt for its "code centric" focus on syntax/error checking, streaming and building. Your gulp tasks are maintained in ./gulpfile.js. By default, you watch for any saves to js files in ./public/javascripts to automatically start a task which checkes for errors and builds. On any javascript save - check syntax with JSCS, look for linting issues, minify css and compress js. This final step also builds a soruce map file. All build products are saved tp ./public/build

new chnages to emulator 2.x.x scripts
---------------------------

I wrote a script to make modifications to the compiled emulators from libretro. modify the work route and emulatorprep as needed for paths and run:

/work/emulatorprep


old chnages to emulator 1.0.0 scripts
---------------------------

- event handling: 

all input events need to now listen specifically to the emulator element:

document.removeEventListener --> parent.window.document.getElementById('emulator').removeEventListener
document.addEventListener --> parent.window.document.getElementById('emulator').addEventListener

the browser window events (pointerlockchange, fullscreenschange) also need to change, but only to the parent document


document.addEventListener('fullscreenchange'... --> parent.window.document.addEventListener('fullscreenchange'...

there's a function called "fullScreenChange" which has a bunch of "document" references. We want to change those too. I had to cleanup these events as they're attached to the main document now.

document. --> parent.window.docuemnt.

- KeyBoard events

This one was a real pain in the ass. First I noticed that I couldn't dispatch events on the canvas itself, don't know why. I decided to expose the event handler within the emulator and then send events directly to it. This works :) What took forever though was discovering that any keydown event MUST be followed by a keyup event. If they trigger at the same time, failure. I put a 10ms gap between them and everything worked. It's NUTS.

First, find this "var RI="
RI is the object with the event handler.
After the object definition, do this "Module.RI = RI"
This exposes the handler to the Module and then our app.

- getting save states

Instead of independantly tracking when the use is changing the state slot values (which I found can get out of sync when spamming the keyboard) I decided to register a callback when a file has been written to the emulator's file system. Look for this block of code:

try {
    var slab = HEAP8;
    return FS.write(stream, slab, buf, nbyte);
  } catch (e) {
    FS.handleFSError(e);
    return -1;
  }

This is the top-most function (FS.write) for writing files. I didn't want my registered function to exist inside the try catch, so I modified this block thusly:

try {
    var slab = HEAP8;
    result = FS.write(stream, slab, buf, nbyte);
  } catch (e) {
    FS.handleFSError(e);
    result = -1;
  }
  if (Module.emulatorFileWritten && stream && stream.node && stream.node.name && stream.node.contents) {
    Module.emulatorFileWritten(stream.node.name, stream.node.contents);
  }
  return result;

.. more than that, be cool and leave the original intact, it'll be removed when you compile anyway:

/* the following was modified for crazyerics.com */

  try {
    var slab = HEAP8;
    result = FS.write(stream, slab, buf, nbyte);
  } catch (e) {
    FS.handleFSError(e);
    result = -1;
  }
  if (Module.emulatorFileWritten && stream && stream.node && stream.node.name && stream.node.contents) {
    Module.emulatorFileWritten(stream.node.name, stream.node.contents);
  }
  return result;

  /* end of modification. original code here:

  try {
    var slab = HEAP8;
    return FS.write(stream, slab, buf, nbyte);
  } catch (e) {
    FS.handleFSError(e);
    return -1;
  }

  */
 
- fullscreen support

Just a side note: I had to modify the mupen64plus emulator file significantly in order for fullscreen support to work. In the end I simply copied functions directly from one of the other working emulators (I used snes) and copied them wholesale into mupen64plus. This was the only emulator I had to do this with, but keep it in mind for the future.

adding roms
-----------

see sister project romsort which builds the correct file structure and data files


various notes
-------------

- using pako as a method to compress all strings, json and uintarrays
- gulp produces 3 files in ./public/build: build.js (all compressed js file contents), a source map file and style.min.css (all compressed css file contents). The layout.jade on your production box references these files instead of the source content.
- in creating icons, unpack the "350-MAI2013.zip" file and then "PSD_and_EPS.zip". Open the eps file in photoshop with a width of 1000. Select the icon, open a new image with it, resize to 32x32px. Invert colors, then max out contract and brightness.

- to update nodejs:

npm cache clean -f
npm install -g n
n stable
node --version
node app.js

