expressjs-crazyerics
=====

Browser-based console emulation

Not included in this repository are game roms of course. They would be held in /public/roms. Add then as necessary. (update this later with more info)

Not included in this repository are the cloned GitHub projects of console emulators. In the /public/emulators folder please clone the following:

/public/emulators/jsnes: https://github.com/bfirsh/jsnes/
/public/emulators/nesboxflash: https://github.com/nesbox/emulator

To get the emulators to function correctly, I had to make some changes while I will detail here for future reference:

Good source for current GoodMerged sets of roms: http://tv-games.ru/download/nes.html

CDN: 

Let's store the site's images on Google Drive. rsync them at each update:

rsync -avz  ~/Projects/expressjs-crazyerics/public/images ~/Google\ Drive/expressjs-crazyerics/public

Rom Storage:

The collection of roms was too large to store on the server itself so I put them on the Synology and shared the folder. Symbolically
link that folder to the public/roms folder:
ln -s /Volumes/Crazyerics.com/public/roms/ ~/Projects/Production/expressjs-crazyerics/public/roms

Good sets used in this project. As of this writing (8/19/15) these are the most up to date sets (I believe):

GoodNES 3.23b 	- valid since 04/14
GoodSNES 3.23 	- valid since 04/14
GoodGen 3.21 	- valid since 10/12
GoodGBx 3.14 	- valid since 10/07

NESBOXFLASH:

none. I use this by default since it handles nes, snes, gb, gbc, gba and gen

JSNES:

This was a node project, so read its README.md file for what to do. It uses grunt for building so I used that and then did an npm install on the project. The build process produces a jsnes.js file which essentially comprises the emulator. This file also includes a lame ui object which is tied to loading roms and various functionality. Instead of heavily modifying the jsnes.js file I ended up using css to hide and javascript to interact with the ui dynamically. I also changed the zoom values (start zoomed and to the width of my main). By default the jsnes.js file was listening to all keyboard events on the document. I added a tabindex to the emulator window and listened for events on it instead.