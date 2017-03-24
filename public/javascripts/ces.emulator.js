var Emulator = (function(gameKey) {

    // private members
    var key = gameKey;

    // public members

    // public methods
    this.CleanUp = function() {

        //since each Module attached an event to the parent document, we need to clean those up too:
        $(document).unbind('fullscreenchange');
        $(document).unbind('mozfullscreenchange');
        $(document).unbind('webkitfullscreenchange');
        $(document).unbind('pointerlockchange');
        $(document).unbind('mozpointerlockchange');
        $(document).unbind('webkitpointerlockchange');

        if (self._FS) {
            self._FS = null;
        }

        if (self._Module) {
            try {
                self._Module.exit(); //calls exit on emulator ending loop (just to be safe)
            } catch (e) {

            }
            self._Module = null;
        }
        if (self.emulatorframe) {
            self.emulatorframe.remove();
            self.emulatorframe = null;
        }
        $('#emulator').remove(); //kill all events attached (keyboard, focus, etc)
    };

});