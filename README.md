expressjs-crazyerics
=====

buliding the application
__________________

Gulp.

I prefer Gulp to Grunt for its "code centric" focus on syntax/error checking, streaming and building. Your gulp tasks are maintained in ./gulpfile.js. By default, you watch for any saves to js files in ./public/javascripts to automatically start a task which checkes for errors and builds. On any javascript save - check syntax with JSCS, look for linting issues, minify css and compress js. This final step also builds a soruce map file. All build products are saved tp ./public/build

Adding new emulators from nightly retroarch builds
__________________

Get them at: https://buildbot.libretro.com/nightly/emscripten/

- The first thing you should do is unpack the 7z in /workspace/ into its own folder (like 2017-03-25_RetroArch or whatever)

You prepare the emulator scripts with two mechanisms to consider - 1) modifying the scripts directly to work with ces.emulator.js and 2) Writing a custom Module object with functions that cooperate with emulator scripts.

1) Modifying the emulator scripts directly

Since all emulator scripts are generated from emscripten, we can batch process the editing process.

- Open up routes/work.js. Under the route "emulatorprep", modify the path variables "EMULATOR_VERSION" and "SOURE_PATH" appropriately. For the EMULATOR_VERSION, use the nightly build date (2017-03-27) since the folder name also informs us of age :)

- IMPORTANT: The EMULATOR_VERSION is also how we assign a system to an emaultor script. "emuextention" is EMULATOR_VERSION and "emuscript" is the javascript file name. 

- Start crazyerics.com and run (changing the host as needed): http://localhost:3000/work/emulatorprep. This will run the emulator script modifing process and place the resulting files in the directory from which they will load. In the output, ensure all replacements/tasks resulted to "true" otherwise you will have to investigate your work.js file.

2) On the software side, you have an emulator class which strongly couples to the directory you created for emulator scripts.

- Create a new emulator extention in /javascripts/emulators. Use the template there to help create a new file. BE SURE to name the file correctly: "ces.[EMULATOR_VERSION].js" - the code will specifically attempt to load this name.

- Most importantly in the file is the section which defines "module". This is the object which the emulator script will extend and the object which we have direct access to in ces. the module object also contains custom functionality ces uses against the module itself. Your best bet is to copy the definition from the previous version and hope everything still works, if not you'll need to modify the module definition most likely. The last thing we want to do is modify the base class (and certainly not ces.main).


various notes
__________________

- heavy modified connect-pg-simple to reference UserService. Called node_module conect-pg-simple-crazyerics as a result. A copy is in tools
- using pako as a method to compress all strings, json and uintarrays
- gulp produces 3 files in ./public/build: build.js (all compressed js file contents), a source map file and style.min.css (all compressed css file contents). The layout.jade on your production box references these files instead of the source content.
- in creating icons, unpack the "350-MAI2013.zip" file and then "PSD_and_EPS.zip". Open the eps file in photoshop with a width of 1000. Select the icon, open a new image with it, resize to 32x32px. Invert colors, then max out contract and brightness.

- to update nodejs:

npm cache clean -f
npm install -g n
n stable
node --version
node app.js

