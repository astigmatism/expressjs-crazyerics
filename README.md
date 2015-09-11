expressjs-crazyerics
=====

building emulators

9/10/15: Okay, I'm a couple of days in trying to get a RetroArch project complied with Emscript with some emulators (notibly the missing NES emulator I don't have). The good news
is that I was able to compile a working RetroArch version, the bad news is that while I seem to be able to Emscript compile some of the emulators (Bnes, Nestopia), I can't get them to
either start (Nestopia) or load up a game (Bnes). Hopefully you don't give up on this because at the time of this writing, no one else in the RetroArch project cares about compiling
to Javascript and you could be the ONLY one with such a nice collection of playable games on the entire web (so I think so far).

Included in /tools is a zip file called "RetroidNetplay-master". This is actually a branch of the RetroArch project at about version 0.9.9.3 when Emscripten compliing was working.
It took me a while to find a version which worked!

- First, get Emscripten installed and working. There were so many steps that I won't repeat them here. The latest version (at this time tag-1.34.8) was working fine.
- Open up the "RetroidNetplay-master" folder. Thankfully, someone was nice and included a .sh file for creating Emscripten solutions. Go to ./dist-scritps
- you should be able to compile the project with "emmake ./emscripten-cores.sh". I did modify the Makefile.emscripten file in the parent with $DEBUG=1 so that no javascript is compiled. This is important because if I can ever get one of these working, you have to make changes to that file (see below) so that it'll run on Crazyerics
- Game cores have to be compiled separately.



chnages to emulator scripts:

- event handling: 

all input events need to now listen specifically to the emulator element:

document.removeEventListener --> parent.window.document.getElementById('emulator').removeEventListener
document.addEventListener --> parent.window.document.getElementById('emulator').addEventListener

the browser window events (pointerlockchange, fullscreenschange) also need to change, but only to the parent document


document.addEventListener('fullscreenchange'... --> parent.window.document.addEventListener('fullscreenchange'...

there's a function called "fullScreenChange" which has a bunch of "document" references. We want to change those too. I had to cleanup these events as they're attached to the main document now.

document. --> parent.window.docuemnt.

-- KeyBoard events

This one was a real pain in the ass. First I noticed that I couldn't dispatch events on the canvas itself, don't know why. I decided to expose the event handler within the emulator and then send events directly to it. This works :) What took forever though was discovering that any keydown event MUST be followed by a keyup event. If they trigger at the same time, failure. I put a 10ms gap between them and everything worked. It's NUTS.

First, find this "var RI="
RI is the object with the event handler.
After the object definition, do this "Module.RI = RI"
This exposes the handler to the Module and then our app.