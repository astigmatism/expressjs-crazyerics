/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPreferences = (function(_Compression, initialData) {

    var _self = this;
    var _data = {};
    var _storageName = 'preferences';

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
        
        _self.Sync.ready = true; //flag to update server
        SetStorage();
    };

    var SetStorage = function() {
        localStorage.setItem(_storageName, _Compression.Compress.json(_data));
    };

    var GetStorage = function() {

        var result;
        try {
            result = localStorage.getItem(_storageName);
            result = _Compression.Decompress.json(result);
        } 
        catch (e) {
            //nothing really, if its invalid, then we wont use it
        }
        return result;
    }

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {
        
        var __self = this;
        this.ready = false;

        this.Incoming = function(preferences) {

            _data = preferences;
            SetStorage();
        };

        this.Outgoing = function() {
            __self.ready = false;
            return _data;
        };

        return this;
    })();

    //exists at bottom to ensure all other methods/members are defined
    var Constructor = (function() {

        //initialData will always be something, but check the client validation flag
        if (initialData.validated === 1) {
            _self.Sync.Incoming(initialData);
            return;
        }
        
        //if here, not validated with client yet. Perhaps client has more up to date data (server restart, cache cleared)
        var clientData = GetStorage();
        
        if (clientData) {
            _self.Sync.Incoming(clientData);
        }
        //there was no client cookie, accept the server data
        else {
            initialData.validated = 1;
            _self.Sync.Incoming(initialData);
        }
        //in either case, we need to update the server cache to inform validation took place
        _self.Sync.ready = true; //update the server with validated data

    })();

    return this;
});