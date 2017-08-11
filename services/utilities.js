const pako = require('pako');
const btoa = require('btoa');
const atob = require('atob');


module.exports = function() {

    //private members

    //public members

    //public methods

    this.Compress = this.In = {
        bytearray: function(uint8array) {
            var deflated = pako.deflate(uint8array, {to: 'string'});
            return btoa(deflated);
        },
        json: function(json) {
            var string = JSON.stringify(json);
            var deflate = pako.deflate(string, {to: 'string'});
            var base64 = btoa(deflate);
            return base64;
        },
        string: function(string) {
            var deflate = pako.deflate(string, {to: 'string'});
            var base64 = btoa(deflate);
            return base64;
        },
        gamekey: function(system, title, file) {
            return this.json({
                system: system,
                title: title,
                file: file
            });
        }
    };

    this.Decompress = this.Out = {
        bytearray: function(item) {
            var decoded = new Uint8Array(atob(item).split('').map(function(c) {return c.charCodeAt(0);}));
            return pako.inflate(decoded);
        },
        json: function(item) {
            var base64 = atob(item);
            var inflate = pako.inflate(base64, {to: 'string'});
            var json = JSON.parse(inflate);
            return json;
        },
        string: function(item) {
            var base64 = atob(item);
            var inflate = pako.inflate(base64, {to: 'string'});
            return inflate;
        }
    };
};
