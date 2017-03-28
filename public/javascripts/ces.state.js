/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
var cesState = (function (initialStateData) {

    //private members
    var self = this;

    /**
     * A pure reflection of state data returned from the server. Object with slot numbers are properties
     * @type {Object}
     * {
     *       screenshot: {string},
     *       state: {string},
     *       time: {number}
     * }
     */
    var data = initialStateData;

    //public methods

    /**
     * Reutns as an array, the slots which hold saved state data
     * @return {Array}
     */
    this.GetSavedSlots = function() {
        return Object.keys(data);
    };

    /**
     * Given a slot, returns image data
     * @param  {number} slot
     * @return {Object}   
     */
    this.GetScreenshot = function(system, slot) {
        if (data[slot] && data[slot].hasOwnProperty('screenshot')) {
            var screenshot = Compression.Decompress.bytearray(data[slot].screenshot);
            var image = buildScreenshot(system, screenshot, 180);
            return image;
        }
        return null;
    };

    /**
     * Given a slot, returns a formatted date string
     * @param  {number} slot
     * @return {string}    
     */
    this.GetDate = function(slot) {
        if (data[slot] && data[slot].hasOwnProperty('time')) {
            var date = new Date(data[slot].time);
            var formatteddate = $.format.date(date, 'ddd MM-dd-yyyy h =mma'); //using the jquery dateFormat plugin
            return formatteddate;
        }
        return null;
    };

    /**
     * Given a slot, returns state data as ByteArray
     * @param  {number} slot 
     * @return {ByteArray}     
     */
    this.GetState = function(slot) {
        if (data[slot] && data[slot].hasOwnProperty('state')) {
            return Compression.Decompress.bytearray(data[slot].state);
        }
        return null;
    };

    /**
     * saves state to server
     * @param  {Object} statedetails
     * @param  {Object} screendetails
     * @return {undef}               
     */
    this.SaveStateToServer = function(statedetails, screendetails) {

        //state details is a resolve on a deferred. all return data in array
        var key = statedetails[0];
        var system = statedetails[1];
        var title = statedetails[2];
        var file = statedetails[3];
        var slot = statedetails[4];
        var statedata = statedetails[5];

        var screenshot = Compression.Compress.bytearray(screendetails);

        //compress payload for server
        var data = Compression.Compress.json({
            'state': statedata,
            'screenshot': screenshot
        });

        $.ajax({
            url: '/states/save?key=' + encodeURIComponent(key) + '&slot=' + slot,
            data: data,
            processData: false,
            contentType: 'text/plain',
            type: 'POST',
            /**
             * on completion of state save
             * @param  {string} data
             * @return {undef}
             */
            complete: function(data) {

                //when complete, we have something to load. show in recently played
                var statedetails = {};
                statedetails[slot] = {
                    time: Date.now(),
                    screenshot: screenshot
                };
                addToPlayHistory(key, system, title, file, null, statedetails);
            }
        });
    };

    return this;

});