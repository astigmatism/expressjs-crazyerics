/**
 * function to manage the capturing of screenshots automatically
 * @param  {string} system          game system
 * @param  {Array} shaderqueue      array of shaders to capture
 * @param  {number} capturedelta    the amount of time in ms to wait before the next capture
 * @param  {number} numberofshots   maximum number of shots to take per shader
 * @return {undef}
 */
Crazyerics.prototype._autoCaptureHarness = function(system, shaderqueue, capturedelta, numberofshots) {

    var self = this;

    if (shaderqueue.length === 0) {
        self._simulateEmulatorKeypress(112); //press f1 on finish to pause
        self.downloadAllScreens();
        return;
    }

    var remaining = numberofshots;

    //get capture details
    var data = self._config.autocapture[system];
    
    self._bootstrap(system, data.title, data.file, null, shaderqueue[0], function() {


        //capture function takes in a macro of key presses to accomplish a click.
        //since this changes from the first shot to the subsequent
        var capture = function(marco) {

            //wait to capture, let the game run
            setTimeout(function() {

                //press F1 to pause the game
                self._simulateEmulatorKeypress(112, null, function() {

                    //run marco to capture a screenshot
                    self._runKeyboardMacro(marco, function() {

                        console.log(shaderqueue[0] + ' shot: ' + remaining);

                        //press F1 again to continue playing game
                        self._simulateEmulatorKeypress(112, null, function() {

                            remaining--;

                            //if remaining shots need to be taken, run the capture function again, otherwise move to next shader
                            if (remaining === 0) {
                                //next in queue
                                shaderqueue.shift();
                                self._autoCaptureHarness(system, shaderqueue, capturedelta, numberofshots);
                                return;
                            } else {
                                capture([88]); //continue capturing
                            }
                        });
                    });
                });
            }, capturedelta);
        };
        capture([40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 88]);
    });    

};

/**
 * a quick function that downlaods all captured screens
 * @return {undef}
 */
Crazyerics.prototype.downloadAllScreens = function() {

    var delay = 500;
    var time = delay;

    $('.screenshotthumb').each(function(index) {
        
        var self = this;
        setTimeout(function() {
            $(self)[0].click();
        }, delay);
        time += delay;
    });
};