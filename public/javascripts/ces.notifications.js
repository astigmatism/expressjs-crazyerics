/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesNotifications = (function(_config, _Compression, $wrapper) {

    //private members
    var self = this;
    var $message = $wrapper.find('p');
    var $icon = $wrapper.find('div.spinner');
    var _transitionDuration = 500; //a magic number, check with css transition
    var _notificationQueue = [];
    var _minimumTimeToShow = 1500; //in ms
    var _minimumTimeTimeout = null; //holds a setTimeout
    var _currentlyShowing = null; //holds a note instance
    var _currentShowingTimeStamp = null; //holds a date instance of when note began showing
    
    /*
    Priority:
    1 - immediately drop all queued notifications and show
    2 - move to front of queue, allowing current to finish first
    3 - normal prior
    */

    var _notification = (function(message, priority, hold, icon) {

        this.message = message || ''; //the message to show
        this.priority = priority || 3; //1-3. 1 being most important
        this.hold = hold || false; //true holds message until clear is published
        this.icon = icon || false; //to show spinner or not, default yes
    });

    //public members

    //public methods
    
    this.Enqueue = function(message, priority, hold, icon) {

        //create notification
        var note = new _notification(message, priority, hold, icon);

        switch (note.priority)
        {
            case 3:
                _notificationQueue.push(note);
                break;
            case 2:
                _notificationQueue.unshift(note); //insert at front
                break;
            case 1:
                //stop everything!
                self.Reset();
                _notificationQueue.push(note);
                break;
        }

        //if nothing showing, show now
        if (!_currentlyShowing)
        {
            this.ShowNext();
        }

    };

    this.ShowNext = function() {
        
        if (_notificationQueue.length > 0)
        {
            _currentlyShowing = _notificationQueue.shift();

            //update dom
            $message.text(_currentlyShowing.message);
            $wrapper.removeClass('closed');
            
            if (_currentlyShowing.icon) {
                $icon.show();
            } else {
                $icon.hide();
            }

            //auto hide if not hold
            if (!_currentlyShowing.hold) {
                _minimumTimeTimeout = setTimeout(function() {
                    self.Hide();
                }, _minimumTimeToShow);
            }

            _currentShowingTimeStamp = Date.now();
        }
    };

    this.Hide = function() {
        
        //sanity check
        if (_currentShowingTimeStamp && _currentlyShowing)
        {
            var timeShown = Date.now() - _currentShowingTimeStamp;
            _currentShowingTimeStamp = null;

            var onMinimumTimeShown = function() {

                $wrapper.addClass('closed');
                
                //when css animation is complete
                setTimeout(function() {

                    _currentlyShowing = false;
                    self.ShowNext(); //move to next in queue

                }, _transitionDuration);
            }

            if (timeShown < _minimumTimeToShow) {
                _minimumTimeTimeout = setTimeout(function() {
                    onMinimumTimeShown();
                }, _minimumTimeToShow - timeShown);
            }
            else {
                onMinimumTimeShown();
            }
        }
    };

    this.Reset = function() {

        _notificationQueue = [];
        $wrapper.addClass('closed');
        _currentShowingTimeStamp = null;
        _currentlyShowing = null;
        
        if (_minimumTimeTimeout) {
            clearTimeout(_minimumTimeTimeout);
        }
        _minimumTimeTimeout = null;
    };

    return this;
});