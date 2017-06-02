/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesNotifications = (function($wrapper) {

    //private members
    var self = this;
    var _autoHideTime = 2000; //in ms
    var $message = $wrapper.find('p');
    var _isShowing = false;
    var _transitionDuration = 500; //a magic number, check with css transition
    var _notificationQueue = [];
    
    var _notification = (function(message, priority, hold) {

        this.message = message || ''; //the message to show
        this.priority = priority || 5; //1-5. 1 being most important
        this.hold = hold || false; //true holds message until clear is published
    });

    //public members

    //public methods
    
    this.Enqueue = function(message, priority, hold) {

        //create notification
        var note = new _notification(message, priority, hold);

        //check if something is showing

        //if priority higher, show now

        //if priority lower, keep in queue until current is complete

        //if nothing showing, show now
        this.Show(note);

    };

    this.Show = function(note) {
        
        _isShowing = true;
        $message.text(note.message);
        $wrapper.removeClass('closed');
    };

    this.Hide = function() {
        
        $wrapper.addClass('closed');
        
        //when css animation is complete
        setTimeout(function() {

            _isShowing = false;

        }, _transitionDuration);
    };

    this.Reset = function() {

        _notificationQueue = [];
        $wrapper.addClass('closed');
        _isShowing = false;
    };

    return this;

});