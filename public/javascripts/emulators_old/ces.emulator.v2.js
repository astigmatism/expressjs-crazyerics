/**
 * Emulator class for v2 effort
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulatorV2 = (function(_Compression, config, system, title, file, key) {

    // private members
    var self = this;
    var keypresslocked = false; //when we're sending a keyboard event to the emulator, we want to wait until that event is complete before any additinal keypresses are made (prevents spamming)

    // public methods

    /**
     * simulator keypress on emulator. used to allow interaction of dom elements
     * @param  {number} key ascii key code
     * @param {number} keyUpDelay the time delay (in ms) the key will be in the down position before lift
     * @return {undef}
     */
    this.SimulateEmulatorKeypress = function(key, keyUpDelay, callback) {

        var keyUpDelay = keyUpDelay || 10;

        //bail if in operation
        if (keypresslocked) {
            return;
        }

        /**
         * [eventHandler description]
         * @param  {Object} event
         * @return {undefined}
         */
        //var eventHandler = function(event) {}; //noop for default, overridden 

        //eventHandler = self.module.JSEvents.crazyericsKeyEventHandler;

        /**
         * [kp description]
         * @param  {number} k
         * @param  {Object} event
         * @return {undefined}
         */
        kp = function(k, event) {
            var oEvent = self.contentDocument.createEvent('KeyboardEvent');

            // Chromium Hack
            Object.defineProperty(oEvent, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
            });
            Object.defineProperty(oEvent, 'which', {
                get : function() {
                    return this.keyCodeVal;
                }
            });

            if (oEvent.initKeyboardEvent) {
                oEvent.initKeyboardEvent(event, true, true, self.contentDocument.defaultView, false, false, false, false, k, k);
            } else {
                oEvent.initKeyEvent(event, true, true, self.contentDocument.defaultView, false, false, false, false, k, 0);
            }

            oEvent.keyCodeVal = k;

            if (oEvent.keyCode !== k) {
                alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
            }

            self.contentDocument.dispatchEvent(oEvent); //dispatch the event on the iframe document
            //eventHandler(oEvent);
            
            debugger;

            $('#emulator').focus();
        };

        kp(key, 'keydown');

        setTimeout(function() {
            kp(key, 'keyup');
        }, keyUpDelay);

        $('#emulator').focus();
        
    };

    // private methods

    /**
     * ajax call to load layout and script of emulator and load it within frame, resolves deffered when loaded
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadEmulator = function(system, deffered) {

        debugger;

        self.module = new cesEmulatorV2.Module();
    };

    return this;
});

cesEmulatorV2.Module = (function() {
    
    var noInitialRun = true;
    var preRun = [];
    var postRun = [];
    var canvas = document.getElementById('emulator');
    
    //run now
    var print = (function() {
        
        var element = document.getElementById('output');
        element.value = ''; // clear browser cache

        return function(text) {
            text = Array.prototype.slice.call(arguments).join(' ');
            // These replacements are necessary if you render to raw HTML
            //text = text.replace(/&/g, "&amp;");
            //text = text.replace(/</g, "&lt;");
            //text = text.replace(/>/g, "&gt;");
            //text = text.replace('\n', '<br>', 'g');
            element.value += text + "\n";
            //element.scrollTop = 99999; // focus on bottom
        };
    })();

    var printErr = function(text) {
        var text = Array.prototype.slice.call(arguments).join(' ');
        var element = window.parent.document.getElementById('output');
        element.value += text + "\n";
        //element.scrollTop = 99999; // focus on bottom
    };
    var setStatus = function(text) {
        
        //for now
        console.log(text);
        return;

        if (Module.setStatus.interval) {
            clearInterval(Module.setStatus.interval);
        }
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var statusElement = window.parent.document.getElementById('status');
        var progressElement = window.parent.document.getElementById('progress');
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
    var totalDependencies = 0;
    var monitorRunDependencies = function(left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    };

    return this;
});
