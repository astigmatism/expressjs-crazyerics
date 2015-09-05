expressjs-crazyerics
=====

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