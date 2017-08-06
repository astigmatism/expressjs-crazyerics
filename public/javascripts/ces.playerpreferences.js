/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPlayerPreferences = (function(_Compression, initialPlayerData) {

    //private members
    var self = this;
    var data = initialPlayerData;
    
    const _systemPrefs = 'preferences.systems.$1'

    //public members

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

        var shader = Get('preferences.systems.' + system + '.shader');
        if (shader != null && typeof shader != 'undefined') {
            return shader;
        }
        return null;
    };

    /**
     * set's a player's shader preference for the system specified.
     * @param {string} system
     * @param {string} value
     */
    this.SetShader = function(system, value) {
        
        Set('preferences.systems.' + system + '.shader', value);
        return data;
    };

    /**
     * Helper function to get values out of nested object structure
     * @param {String} key 
     */
    var Get = function(key, values) {
        return key.split('.').reduce(function(o, x) {
            return (typeof o == 'undefined' || o === null) ? o : o[x];
        }, data);
    };

    var Set = function(key, value) {

        var pieces = key.split('.');
        var currentDepth = data;

        for (var i = 0, len = pieces.length; i < len; ++i) {
            
            var valueToInsert = {};
            //final assigns value
            if (i == len - 1) {
                valueToInsert = value;
            }
            
            if (!currentDepth.hasOwnProperty(pieces[i])) {
                currentDepth[pieces[i]] = valueToInsert;

            } else if (typeof currentDepth[pieces[i]] != 'object') {
                currentDepth[pieces[i]] = valueToInsert;
            } 
            currentDepth = currentDepth[pieces[i]];
        }
    };

    var Constructor = (function() {


    });

    return this;

});