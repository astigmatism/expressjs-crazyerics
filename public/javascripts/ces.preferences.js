/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPreferences = (function(_Compression, initialData) {

    //private members
    var _self = this;
    var _data = initialData;
    var _updateServer = false;

    //public members

    //public methods

    /**
     * this function will append a query string informing the server that preferences needs to be updated using the
     * client's cookie. Users might try and temper with this obviously easy value to change but it will only effect/hurt their
     * own experience so I'm not worried about security on this data
     */
    this.UpdateServer = function() {
        
        var qs = 'pu='; //pu - preferences update!
        
        if (_updateServer) {
            _updateServer = false;
            return qs + '1';
        }
        return qs + '0';
    }

    /**
     * returns player's shader preference for the system specified
     * @param  {string} system
     * @return {string}
     */
    this.GetShader = function(system) {

        var shader = Get('systems.' + system + '.shader');
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
        
        Set('systems.' + system + '.shader', value);
        return _data;
    };

    /**
     * Helper function to get values out of nested object structure
     * @param {String} key 
     */
    var Get = function(key, values) {
        return key.split('.').reduce(function(o, x) {
            return (typeof o == 'undefined' || o === null) ? o : o[x];
        }, _data);
    };

    var Set = function(key, value) {

        var pieces = key.split('.');
        var currentDepth = _data;

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
        _updateServer = true;
        SetCookie();
    };

    var SetCookie = function() {

        var cookieName = 'preferences';
        var value = _Compression.Compress.json(_data);

        //a jquery plugin
        if (Cookies) {
            Cookies.set(cookieName, value);
        }
    };

    //exists at bottom to ensure all other private methods/members are defined
    var Constructor = (function() {

        //if the server provided data, trust it implicitly.
        if (_data) {
            SetCookie();
        }

    })();

    return this;
});