/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulator = (function(_Compression, config, system, title, file, key) {

    // private members
    var self = this;

    // public/protected members (on prototytpe)

    // public/protected methods
    this.createModule = function() {
        return new module();
    };

    //module def
    var module = (function() {

        this.noInitialRun = true;
        this.preRun = [];
        this.postRun = [];
        this.canvas = document.getElementById('emulator');
        
        //run now
        this.print = (function() {
            
            var element = document.getElementById('output');
            element.value = ''; // clear browser cache

            return function(text) {
                text = Array.prototype.slice.call(arguments).join(' ');
                element.value += text + "\n";
            };
        })();

        this.printErr = function(text) {
            var text = Array.prototype.slice.call(arguments).join(' ');
            var element = document.getElementById('output');
            element.value += text + "\n";
        };

        //an override to prevent
        this.setWindowTitle = function(title) {
            console.log('Module wanted to rename title: ' + title);
        };

        this.setStatus = function(text) {
            
            //for now
            console.log(text);
            return;

            if (this.setStatus.interval) {
                clearInterval(this.setStatus.interval);
            }
            var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
            var statusElement = document.getElementById('status');
            var progressElement = document.getElementById('progress');
            if (m) {
                text = m[1];
                progressElement.value = parseInt(m[2])*100;
                progressElement.max = parseInt(m[4])*100;
                progressElement.hidden = false;
            } else {
                progressElement.value = null;
                progressElement.max = null;
                progressElement.hidden = true;
            }
            statusElement.innerHTML = text;
        };
        
        this.totalDependencies = 0;
        this.monitorRunDependencies = function(left) {
            this.totalDependencies = Math.max(this.totalDependencies, left);
            if (this) {
                this.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
            }
        };

        /**
         * A custom function I add to the Module prototype for shutting down the current running Module
         * @return {undef}
         */
        this.cesExit = function() {
            this["noExitRuntime"] = false; //ok, at this time, this is how you tell the running script you want exit during runtime
            this.exit('Force closed by ces');
        };


        /**
         * window and document event handling control
         * OK! So we want keyboard input going to the emulator when it is in progress and we don't want it to when the emulator is paused
         * to accomplish this, we have to keep references to all events attached to both window and document, remove them when
         * paused and reapply them when resumed.
         * @type {Boolean}
         */
        this.eventHandlersAttached = true;
        
        this.cachedEventHandlers = {
            window: {},
            document: {},
            keydown: {}
        };

        /**
         * See work.js for insertion code.
         * Whenever a new event handler is registered in the emaultor, call this function back with the handler
         * @param  {Object} eventHandler
         * @return {undef}              
         */
        this.cesEventHandlerRegistered = function (eventHandler) {

            //ensure the current format
            if (eventHandler.target && eventHandler.eventTypeString) {
                
                //these are the event targets and types we care to track
                if (eventHandler.target == window) {
                    this.cachedEventHandlers.window[eventHandler.eventTypeString] = eventHandler;
                }
                if (eventHandler.target == document) {
                    this.cachedEventHandlers.document[eventHandler.eventTypeString] = eventHandler;
                }

                //in the case of keypress handlers
                if (eventHandler.eventTypeString == 'keydown') {
                    
                    var originalWork = eventHandler.handlerFunc;
                    
                    eventHandler.handlerFunc = function(event) {

                        //perform original handler function
                        originalWork(event);

                        //run my function next to inform ces what the last keypress was!
                        if (self.OnEmulatorKeydown) {
                            self.OnEmulatorKeydown(event);
                        }
                    };

                    this.cachedEventHandlers.keydown[eventHandler.eventTypeString] = eventHandler;
                }
            }

            return eventHandler;
        };

        this.cesEmulatorFileWritten = function(filename, contents) {

            if (self.OnEmulatorFileWrite) {
                self.OnEmulatorFileWrite(filename, contents);
            }
        };

        /**
         * This function is called when input is resumed on the emulator or it is taken away
         * @param  {bool} giveEmulatorInput
         * @return {undef}
         */
        this.giveEmulatorControlOfInput = function(giveEmulatorInput) {

            if (giveEmulatorInput) {

                //if giving back input, reassign all input handlers for both window and document
                if (this.JSEvents && this.JSEvents.registerOrRemoveHandler && !this.eventHandlersAttached) {
                        
                    for (eventHandler in this.cachedEventHandlers.window) {
                        this.JSEvents.registerOrRemoveHandler(this.cachedEventHandlers.window[eventHandler]);
                    }
                    for (eventHandler in this.cachedEventHandlers.document) {
                        this.JSEvents.registerOrRemoveHandler(this.cachedEventHandlers.document[eventHandler]);
                    }
                }

            } else {

                //if removing event handlers, made call and inform Module they are not attached
                if (this.JSEvents && this.JSEvents.removeAllHandlersOnTarget) {

                    this.JSEvents.removeAllHandlersOnTarget(window);
                    this.JSEvents.removeAllHandlersOnTarget(document);
                    this.eventHandlersAttached = false;
                }

            }
        };

        return this;
    });

    return this;
});
