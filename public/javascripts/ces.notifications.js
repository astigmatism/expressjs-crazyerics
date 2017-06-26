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
    var _currentlyShowing = null;
    
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

        _notificationQueue.push(note);

        //TODO: decide how to handle priority (if needed)
        //insert into queue

        //if nothing showing, show now
        this.ShowNext();

    };

    this.ShowNext = function() {
        
        if (_notificationQueue.length > 0)
        {
            _isShowing = true;
            _currentlyShowing = _notificationQueue.shift();

            //update dom
            $message.text(_currentlyShowing.message);
            $wrapper.removeClass('closed');

            //auto hide if not hold
            if (!_currentlyShowing.hold) {
                setTimeout(function() {
                    self.Hide();
                }, _autoHideTime);
            }
        }
    };

    this.Hide = function() {
        
        $wrapper.addClass('closed');
        
        //when css animation is complete
        setTimeout(function() {

            _isShowing = false;

            self.ShowNext(); //move to next in queue

        }, _transitionDuration);
    };

    this.Reset = function() {

        _notificationQueue = [];
        $wrapper.addClass('closed');
        _isShowing = false;
    };

    return this;
});