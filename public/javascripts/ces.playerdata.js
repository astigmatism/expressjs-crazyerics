/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPlayerData = (function(_Compression, initialPlayerData) {

    //private members
    var self = this;
    var data = initialPlayerData;
    var _playHistory = initialPlayerData.playhistory;
    
    //public members

    //public methods

    /**
     * Add or update a game in the play history area
     * @param {Object} key    unique game key
     * @param {string} system
     * @param {string} title
     * @param {string} file
     * @param {Date} played     date game last played
     * @param {Object} slots    {slot: 3, date: date} //date state saved as property
     * @return {bool} whether the game exists in history already or not
     */
    this.AddToPlayHistory = function(key, system, title, file, played, slots) {

        //handling dupes will be a common function, replace the date and handle the states slots
        if (key in _playHistory) {
            _playHistory[key].played = Date.now();
            return {
                isnew: false,
                data: _playHistory[key]
            };
        }

        //not a dupe, let's create a new play histry game

        //create a local store to take this with handle to dom elements
        _playHistory[key] = {
            system: system,
            title: title,
            file: file,
            played: played || Date.now(),
            slots: slots || {}
            //stateswrapper: stateswrapper
        };

        return {
            isnew: true,
            data: _playHistory[key]
        };
    };

    this.RemoveFromPlayHistory = function(key) {
        delete _playHistory[key];
    };

    this.GetPlayHistory = function() {
        return _playHistory;
    };

    /**
     * get player preference property
     * @param  {string} key
     * @return {string}
     */
    this.Get = function(key) {
        if (data.hasOwnProperty(key)) {
            return data[key];
        }
        return null;
    };

    /**
     * returns player's shader preference for the system specified
     * @param  {string} system
     * @return {string}
     */
    this.GetShader = function(system) {
        if (data.shaders && data.shaders.hasOwnProperty(system)) {
            return data.shaders[system];
        }
        return null;
    };

    /**
     * set's a player's shader preference for the system specified.
     * @param {string} system
     * @param {string} value
     */
    this.SetShader = function(system, value) {
        if (data.shaders) {
            data.shaders[system] = value;
        }
        return;
    };

    var Constructor = (function() {


    });

    return this;

});