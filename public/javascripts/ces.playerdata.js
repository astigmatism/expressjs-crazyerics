/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var PlayerData = (function(initialPlayerData) {

    //private members

    var data = initialPlayerData;

    //public methods

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

});