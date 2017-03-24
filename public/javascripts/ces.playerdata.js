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
    this.get = function(key) {
        if (this._data.hasOwnProperty(key)) {
            return this._data[key];
        }
        return null;
    };

    /**
     * returns player's shader preference for the system specified
     * @param  {string} system
     * @return {string}
     */
    this.getShader = function(system) {
        if (this._data.shaders && this._data.shaders.hasOwnProperty(system)) {
            return this._data.shaders[system];
        }
        return null;
    };

    /**
     * set's a player's shader preference for the system specified.
     * @param {string} system
     * @param {string} value
     */
    this.setShader = function(system, value) {
        if (this._data.shaders) {
            this._data.shaders[system] = value;
        }
        return;
    };

});