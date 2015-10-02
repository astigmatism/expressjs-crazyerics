expressjs-crazyerics
=====

building emulators
------------------

9/11/15: Okay, now that I understand (somewhat) the build procedure for RetroArch and its emulation cores, I'll detail it here. That being said, while I can build the most current version of RetroArch just fine, not a single one of the "cores" (console emulators) seems to work when I start it up and attempt to load a game. I have no idea why and debugging why an emulator in javascript through the host of another app sounds like a nightmare undertaking.

- First, get Emscripten installed and working (https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html). There were so many steps that I won't repeat them here. The latest version (at this time tag-1.34.8) was working fine.

- From GitHub, get the RetroArch project (https://github.com/libretro/RetroArch). At the time of this writting its at version 1.2.2, commit 9fa376a835fff55710826029353cde4d7e6e12c7. I only say this because Emscripten compiling is working at this time :) You never know about its support later. On a side note - I actually went back in time to version 0.9.9.3 which I learned to compile from and then attempted the latest release with all my new "learnings" and it worked just fine :P

- We're going to modify the ./dist-scripts/dist-cores.sh file. 

Replace this, with this:
make -C ../ -f Makefile.emscripten LTO=$lto -j7 clean || exit 1
make -C ../ -f Makefile.emscripten DEBUG=1 clean || exit 1

I'm replacing the optimization options with a flag which does does none. This is important because I need to modify the source once built for the emulator to work on Crazyerics (see below)

- Ok, so we can't build anything yet until we have byte-code from an Emscripten compiled libretro "core" (or emulator). Browse the repository at https://github.com/libretro. There are actually a ton of cores out there all somewhat with active development.

- Compiling a core doesn't take much work but might mean modifying the ./Makefile or ./Makefile.libretro. We need to include instruction for output when the platform is Emscripten and often it won't have it. Open up the make file and ensure something like this exists:

# emscripten
else ifeq ($(platform), emscripten)
	TARGET := $(TARGET_NAME)_libretro_emscripten.bc

- You should now be able to attempt a build. Be sure to include the platform parameter:

emmake make -f ./Makefile platform=emscripten

- If successful, you'll end up with a .bc file which represents byte-level code of the core. We can not use this when building RetroArch.

- Drop the .bc (one or several) into the ./dist-scripts/ folder in the RetroArch project. They'll now be directly alongside the dist-cores.sh file you'll run:

emmake ./dist-cores.sh emscripten

- Congrats, a resulting javascript file of the core with RetroArch will now be in the ./emscripten folder in the RetroArch project. I suggest trying it out in that location with the template.html file they include for testing. If you have any luck it'll open a game, I've yet to see this :(

Alright, that's about it. I might try this whole procedure on a Windows or Ubuntu box as maybe the OSX c++ compilers (g++?) don't offer as much compatibility? Hard to say but rarely do I see a core built without several warnings thrown. I still get a build product of course but its suspect. Maybe you'll have some luck there in the future :)


chnages to emulator scripts
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

You're likely going to add more systems later in the future right? A number of steps need to be taken to ensure exact compatibility and consumption here.

1) Add the system details to the configs. Check out ./config/default.json. You won't be able to add all the system details yet, but get as far as adding file extensions, we use those to filter out non-playable files when we look at the file system

2) Ensure your collection is GoodTools compatible. I explicitly check for GoodTools nomenclature like regions (U), version (V1.1) and a host of other symbols as part of the rom's name. Likewise, we expect titles for a system to be folders with rom files inside them. This isn't always the case, so...

3) Build Rom Folders. Separate out the titles which are folders and place them someplace safe. Leave behind, ./public/roms/[system] the rom files which were not in folders (they likely had just one file so whomever 7z'ed them didn't think they should get a folder).

Now run /build/folders/[system]

This will create a folder for each file and place the file into it. You can then rejoin all the other folders you set aside.

The ./public/roms/[system] folder should now hold all titles, each as a folder with the rom files inside each title folder.

4) Build Data. This step is going to iterate through all system folders and files and build the ./data/[system].json file for each system and in addition the ./data/all.json file used by the search engine. These files essentially encapsulate what are the game's db. Files contents are cached in memory and get retrieved very quickly by the app.

Now run /build/data

We have to rebuild each system in other to build a new all.json. This process will take a while as we calculate which rom file is best suited to load by default.

5) Zip. The rom files cannot exist in an uncompressed format and our application expects them to be zipped.

Create a ./public/zipped folder

Now run /build/zip/[system]

6) Flatten.

various notes
-------------

- using pako as a method to compress all strings, json and uintarrays
- gulp produces two files in ./public/build: build.js (all compressed js file contents) and style.min.css (all compressed css file contents). The layout.jade on your production box references these files instead of the source content.

