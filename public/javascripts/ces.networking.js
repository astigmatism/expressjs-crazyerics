/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesNetworking = (function(_config, _Compression) {

    //private members
    var _self = this;
    var _components = {};

    this.Post = function(url, body, callback) {

        body = body || {};

        //before sending out post request, check sync to see if client wants to update server
        for (var key in _components) {
            if (_components[key].ready) {
                body[key] = _Compression.Compress.json(_components[key].Outgoing()); //compress the json from the Outgoing function
            }
        }

        $.post(url, body, function(data) {

            //we handle decompression here, before dispatching
            var response = _Compression.Decompress.json(data);

            //do any components need updating from the server?
            
            callback(response);
        });
    };

    this.RegisterComponent = function(key, syncObject) {

        //making assumption that sync component is correctly structured
        _components[key] = syncObject;
    };
    
});