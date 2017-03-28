/**
 * Emulator class for v1 emulators ripped from initial enscripten effort (Toad King's work)
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulatorV1 = (function(_Compression, config, system, title, file, key) {

    // private members
    var self = this;
    var keypresslocked = false; //when we're sending a keyboard event to the emulator, we want to wait until that event is complete before any additinal keypresses are made (prevents spamming)

    // public members

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
        var eventHandler = function(event) {}; //noop for default, overridden 

        eventHandler = self.module.RI.eventHandler;

        keypresslocked = true;
        var e;
        e = $.Event('keydown');
        e.keyCode = key;
        e.which = key;
        eventHandler(e); //dispatch keydown
        setTimeout(function() {
            e = $.Event('keyup');
            e.keyCode = key;
            e.which = key;
            eventHandler(e); //after wait, dispatch keyup
            setTimeout(function() {
                keypresslocked = false;
                if (callback) {
                    callback();
                }
            }, 100);
        }, keyUpDelay);

        $('#emulator').focus();
        
    };

    // public methods

    return this;
});
