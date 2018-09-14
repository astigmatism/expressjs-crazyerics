
var cesLogging = (function(_config) {

    var self = this;
    var disable = false; //global disable all logging

    //console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');

    this.Console = function(sender, message, opt_css) {

        if (disable) return;

        opt_css = opt_css || '';
        console.log('%c' + sender + ':%c ' + message, 'background-color: #eee; color: #' + toHexColour(sender) + ';', '');
    };

    // Hash any string into an integer value
    // Then we'll use the int and convert to hex.
    var hashCode = function (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };

    // Convert an int to hexadecimal with a max length
    // of six characters.
    var intToARGB = function (i) {
        var hex = ((i>>24)&0xFF).toString(16) +
                ((i>>16)&0xFF).toString(16) +
                ((i>>8)&0xFF).toString(16) +
                (i&0xFF).toString(16);
        // Sometimes the string returned will be too short so we 
        // add zeros to pad it out, which later get removed if
        // the length is greater than six.
        hex += '000000';
        return hex.substring(0, 6);
    };

    // Extend the string type to allow converting to hex for quick access.
    var toHexColour = function(string) {
        return intToARGB(hashCode(string));
    };

    //public members
    return this;
});
