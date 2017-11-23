/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPreferences = (function(_Compression, _PubSub, initialData) {

    var _self = this;
    var _data = {};
    var _storageName = 'preferences';

    /**
     * Helper function to get values out of nested object structure
     * @param {String} key 
     */
    this.Get = function(key, values) {
        return key.split('.').reduce(function(o, x) {
            return (typeof o == 'undefined' || o === null) ? o : o[x];
        }, _data);
    };

    this.Set = function(key, value) {

        var pieces = key.split('.');
        var currentDepth = _data;

        for (var i = 0, len = pieces.length; i < len; ++i) {
            
            var valueToInsert = {};
            var currentKey = pieces[i];

            //final assigns value
            if (i == len - 1) {
                currentDepth[currentKey] = value;
                break;
            }
            
            //if this key is not found in preferences, create or insert it
            if (!currentDepth.hasOwnProperty(currentKey)) {
                currentDepth[currentKey] = valueToInsert;

            } 
            //if it was found, but the depth is not an object, create or insert it
            else if (typeof currentDepth[currentKey] != 'object') {
                currentDepth[currentKey] = valueToInsert;
            }

            //move into next
            currentDepth = currentDepth[currentKey];
        }
        
        _self.Sync.ready = true; //flag to update server
        SetStorage();
    };

    var SetStorage = function() {
        console.log(_data);
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
    };

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
        
        //client always gets authority on values, unless they don't exist
        var clientData = GetStorage();
        
        if (clientData) {
            _self.Sync.Incoming(clientData);
        }
        //there was no client cookie, accept the server data
        else if (initialData) {
            _self.Sync.Incoming(initialData);
        }

        _self.Sync.ready = true; //update the server with validated data


        //listen to these
        _PubSub.Subscribe('setpreference', _self, function(key, value) {
            Set(key, value);
        });

    })();

    return this;
});