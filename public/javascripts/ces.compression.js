var cesCompression = (function() {
	
	var _self = this;

	var GameKey = (function(system, title, file, gk) {
		this.system = system;
		this.title = title;
		this.file = file;
		this.gk = gk;			//the original compressed json of this key should it be needed again
	});

	//public methods

	this.Compress = {
	    /**
	     * compress and base64 encode a uint8array
	     * @param  {UInt8Array} uint8array
	     * @return {string}
	     */
	    bytearray: function(uint8array) {
	        var deflated = pako.deflate(uint8array, {to: 'string'});
	        return btoa(deflated);
	    },
	    /**
	     * comrpess and base64 encode a json object
	     * @param  {Object} json
	     * @return {string}
	     */
	    json: function(json) {
	        var string = JSON.stringify(json);
	        var deflate = pako.deflate(string, {to: 'string'});
	        var base64 = btoa(deflate);
	        return base64;
	    },
	    /**
	     * compress and base64 encode a string
	     * @param  {string} string
	     * @return {string}
	     */
	    string: function(string) {
	        var deflate = pako.deflate(string, {to: 'string'});
	        var base64 = btoa(deflate);
	        return base64;
	    },
	    /**
	     * a "gamekey" is an identifer on the server-end for system, title, file. we use it for a bunch of stuff from loading/saving states to loading games
	     */
	    gamekey: function(gameKey) {
	        //just a reminder not to call this. gameKey.gk is the answer
	    }
	};

	this.Decompress = {
	    /**
	     * decompress and base64 decode a string to uint8array
	     * @param  {string} item
	     * @return {UInt8Array}
	     */
	    bytearray: function(item) {
	        var decoded = new Uint8Array(atob(item).split('').map(function(c) {return c.charCodeAt(0);}));
	        return pako.inflate(decoded);
	    },
	    /**
	     * decompress and base64 decode a string to json
	     * @param  {string} item
	     * @return {Object}
	     */
	    json: function(item) {
	        var base64 = atob(item);
	        var inflate = pako.inflate(base64, {to: 'string'});
	        var json = JSON.parse(inflate);
	        return json;
	    },
	    /**
	     * decompress a string
	     * @param  {string} item
	     * @return {string}
	     */
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

	// public aliases

	this.Zip = this.Compress;
	this.Unzip = this.Decompress;

	this.In = this.Compress;
	this.Out = this.Decompress;

	return this;

});