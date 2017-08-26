'use strict';
const pako = require('pako');
const btoa = require('btoa');
const atob = require('atob');

module.exports = new (function() {

    var _self = this;

    var GameKey = (function(system, title, file, gk) {
		this.system = system;
		this.title = title;
		this.file = file;
		this.gk = gk;			//the original compressed json of this key should it be needed again
	});

    this.Compress = this.In = this.Zip = {
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
        gamekey: function(gameKey) {
            //try not to do this! gamekeys are predefined in masterfiles
            //return this.json([gameKey.system, gameKey.title, gameKey.file]);
	    }
    };

    this.Decompress = this.Out = this.Unzip = {
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
        },
        gamekey: function(gk) {
			var gameKey;
			try {
				gameKey = this.json(gk);
			} catch (e) {
				return;
			}
			//must be an array of length 3 [system, title, file]
			if (gameKey.length && gameKey.length === 3) {
				return new GameKey(gameKey[0], gameKey[1], gameKey[2], gk);
			}
			return;
		}
    };

    this.Shuffle = function(o) {
        for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }; 

    /**
     * A nice way to merge/expand json
     */
    this.Assign = function (object, keys, value) {
        keys = keys.split('.');
        object = object || {};
        var currentObject = object;
        for (var i = 0, len = keys.length; i < len; ++i) {
            if (i === len - 1) {
                currentObject[keys[i]] = value;
            }
            else {
                if (!(keys[i] in currentObject)) {
                    currentObject[keys[i]] = {};
                }
                currentObject = currentObject[keys[i]];
            }
        }
        return object;
    };

    this.GetNestedValue = function(object, keys) {
        keys = keys.split('.');
        var currentObject = object;
        for (var i = 0, len = keys.length; i < len; ++i) {
            if (!currentObject || !currentObject.hasOwnProperty(keys[i])) {
                return undefined;
            }
            if (i === len - 1) {
                return currentObject[keys[i]];
            }
            currentObject = currentObject[keys[i]];
        }
        return undefined;
    }

})();
