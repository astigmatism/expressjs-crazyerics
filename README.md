expressjs-crazyerics
=====

Browser-based console emulation

Not included in this repository are game roms of course. They would be held in /public/roms. Add then as necessary. (update this later with more info)

Not included in this repository are the cloned GitHub projects of console emulators. In the /public/emulators folder please clone the following:

/public/emulators/jsnes: https://github.com/bfirsh/jsnes/
/public/emulators/nesboxflash: https://github.com/nesbox/emulator

To get the emulators to function correctly, I had to make some changes while I will detail here for future reference:

JSNES:

This was a node project, so read its README.md file for what to do. It uses grunt for building so I used that and then did an npm install on the project. The build process produces a jsnes.js file which essentially comprises the emulator. This file also includes a lame ui object which is tied to loading roms and various functionality. Instead of heavily modifying the jsnes.js file I ended up using css to hide and javascript to interact with the ui dynamically. I also changed the zoom values (start zoomed and to the width of my main). By default the jsnes.js file was listening to all keyboard events on the document. I added a tabindex to the emulator window and listened for events on it instead.