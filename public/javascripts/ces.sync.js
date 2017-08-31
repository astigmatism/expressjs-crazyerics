/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSync = (function(_config, _Compression) {

    //private members
    var _self = this;
    var _components = {};

    this.Post = function(url, body, callback) {

        body = body || {};
        body._c = body._c || {}; //component data
        var componentData = {};

        //before sending out post request, check sync to see if client wants to update server
        for (var key in _components) {
            if (_components[key].ready) {
                componentData[key] = _components[key].Outgoing(); //compress the json from the Outgoing function
            }
        }

        //append compressed component data to update server with
        body._c = _Compression.Compress.json(componentData);

        $.post(url, body, function(data) {

            //we handle decompression here, before dispatching
            var response = _Compression.Decompress.json(data);

            //component data in response
            if (response._c) {

                for (var key in _components) {
                    if (response._c[key]) {
                        _components[key].Incoming(response._c[key]);
                    }
                }
            }
            
            callback(response);
        });
    };

    this.RegisterComponent = function(key, syncObject) {

        //making assumption that sync component is correctly structured
        _components[key] = syncObject;
    };
    
});