/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesNotifications = (function($wrapper) {

    //private members
    var self = this;
    var _autoHideTime = 2000; //in ms
    var $message = $wrapper.find('p');
    
    //public members

    //public methods
    this.Show = function(message, hold) {
        
        $message.text(message);
        $wrapper.removeClass('closed');
    };

    return this;

});