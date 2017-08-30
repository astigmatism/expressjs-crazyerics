/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesNetworking = (function(_config, _Compression) {

    //private members
    var _self = this;
    var _components = {};

    this.Post = function(url, body, callback) {

        //before sending out post request, check sync to see if client wants to update server

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