/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesNotifications = (function(_config, _Compression, _PubSub, $wrapper) {

    function NormalizeDuration(value, fallback) {
        var duration = parseInt(value, 10);

        if (isNaN(duration) || duration <= 0) {
            return fallback;
        }

        return duration;
    }

    function GetConfigDuration(names, fallback) {
        var sources = [];
        var i;
        var j;

        if (_config) {
            sources.push(_config.notifications);
            sources.push(_config.notificationDurations);
            sources.push(_config);
        }

        for (i = 0; i < sources.length; i++) {
            if (!sources[i]) {
                continue;
            }

            for (j = 0; j < names.length; j++) {
                if (Object.prototype.hasOwnProperty.call(sources[i], names[j])) {
                    return NormalizeDuration(sources[i][names[j]], fallback);
                }
            }
        }

        return fallback;
    }

    function NormalizeOptions(options) {
        if (typeof options === 'number' || typeof options === 'string') {
            return { timeout: options };
        }

        if (options && typeof options === 'object') {
            return options;
        }

        return {};
    }

    function GetOptionDuration(options, names, fallback) {
        var i;

        options = NormalizeOptions(options);

        for (i = 0; i < names.length; i++) {
            if (Object.prototype.hasOwnProperty.call(options, names[i])) {
                return NormalizeDuration(options[names[i]], fallback);
            }
        }

        return fallback;
    }

    //private members
    var self = this;
    var $message = $wrapper.find('p');
    var $icon = $wrapper.find('div.spinner');
    var _transitionDuration = 500; //a magic number, check with css transition
    var _defaultTimeToShow = GetConfigDuration(['defaultTimeToShow', 'defaultTimeout', 'defaultTimeoutMs', 'defaultDuration', 'defaultDurationMs', 'defaultDisplayDuration', 'defaultDisplayDurationMs'], 3500); //in ms
    var _minimumTimeToShow = GetConfigDuration(['minimumTimeToShow', 'minimumTimeout', 'minimumTimeoutMs', 'minimumDuration', 'minimumDurationMs', 'minimumDisplayDuration', 'minimumDisplayDurationMs'], 300); //in ms
    var _notificationQueue = [];
    var _autoHideTimeout = null; //holds a setTimeout for normal auto close
    var _deferredHideTimeout = null; //holds a setTimeout when enforcing minimum display time
    var _transitionTimeout = null; //holds a setTimeout for css close transition
    var _currentlyShowing = null; //holds a note instance
    var _currentShowingTimeStamp = null; //holds a date instance of when note began showing
    var _passageOfTime = 10; //in s. the amount of time to pass before showing (n seconds ago) on the notification
    
    /*
    Priority:
    1 - immediately drop all queued notifications and show
    2 - move to front of queue, allowing current to finish first
    3 - normal prior
    */

    var _notification = (function(message, priority, hold, icon, topic, options) {

        options = NormalizeOptions(options);

        this.message = message || ''; //the message to show
        this.priority = priority || 3; //1-3. 1 being most important
        this.hold = hold || false; //true holds message until clear is published
        this.icon = icon || false; //to show spinner or not, default yes
        this.topic = topic || null; //the pubsub topic to subscribe to for when to close
        this.timeToShow = GetOptionDuration(options, ['duration', 'durationMs', 'displayDuration', 'displayDurationMs', 'timeout', 'timeoutMs'], _defaultTimeToShow);
        this.minimumTimeToShow = GetOptionDuration(options, ['minimumDuration', 'minimumDurationMs', 'minimumDisplayDuration', 'minimumDisplayDurationMs', 'minimumTimeToShow', 'minimumTimeToShowMs'], _minimumTimeToShow);
        this.timeAdded = Date.now(); //the time the notification was supposed to occur
    });

    var ClearAutoHideTimeout = function() {
        if (_autoHideTimeout) {
            clearTimeout(_autoHideTimeout);
            _autoHideTimeout = null;
        }
    };

    var ClearDeferredHideTimeout = function() {
        if (_deferredHideTimeout) {
            clearTimeout(_deferredHideTimeout);
            _deferredHideTimeout = null;
        }
    };

    var ClearTransitionTimeout = function() {
        if (_transitionTimeout) {
            clearTimeout(_transitionTimeout);
            _transitionTimeout = null;
        }
    };

    var ClearNotificationTimeouts = function() {
        ClearAutoHideTimeout();
        ClearDeferredHideTimeout();
        ClearTransitionTimeout();
    };

    //public members

    //public methods
    
    this.Enqueue = function(message, priority, hold, icon, topic, options) {

        //create notification
        var note = new _notification(message, priority, hold, icon, topic, options);

        switch (note.priority)
        {
            case 1:
                //stop everything!
                self.Reset();
                _notificationQueue.push(note);
                break;
            case 2:
                _notificationQueue.unshift(note); //insert at front
                break;
            case 3:
            default:
                _notificationQueue.push(note);
                break;
        }
        
        //pubsub to close?
        if (topic) {

            _PubSub.SubscribeOnce(topic, self, function() {

                //since the condition was met to close this note, if it hasn't shown yet (in queue) set its hold to false
                note.hold = false;
                
                //if it is the currently showing, close it
                if (_currentlyShowing === note) {
                    self.Hide();
                }
            });
        }

        //if nothing showing, show now
        if (!_currentlyShowing)
        {
            this.ShowNext();
        }

    };

    this.ShowNext = function() {
        
        ClearNotificationTimeouts();

        if (_notificationQueue.length > 0)
        {
            _currentlyShowing = _notificationQueue.shift();

            var occurTimeDiff = (Date.now() - _currentlyShowing.timeAdded) / 1000; //mil to secs

            var message = _currentlyShowing.message;

            //if the time the note was queued to the time it was shown is greater than 5 second, append that message
            if (occurTimeDiff > _passageOfTime) {
                var value = Math.floor(occurTimeDiff);
                message += '(' + value + ' second' + (value > 1 ? 's' : '') + ' ago)';
            }

            //update dom
            $message.text(message);
            $wrapper.removeClass('closed');
            
            if (_currentlyShowing.icon) {
                $icon.show();
            } else {
                $icon.hide();
            }

            _currentShowingTimeStamp = Date.now();

            //auto hide if not hold
            if (!_currentlyShowing.hold) {
                _autoHideTimeout = setTimeout(function() {
                    _autoHideTimeout = null;
                    self.Hide();
                }, _currentlyShowing.timeToShow);
            }
        }
    };

    this.Hide = function() {
        
        //sanity check
        if (_currentShowingTimeStamp && _currentlyShowing)
        {
            var note = _currentlyShowing;
            var timeShown = Date.now() - _currentShowingTimeStamp;
            _currentShowingTimeStamp = null;

            ClearAutoHideTimeout();
            ClearDeferredHideTimeout();

            var onMinimumTimeShown = function() {

                if (_currentlyShowing !== note) {
                    return;
                }

                $wrapper.addClass('closed');
                
                //when css animation is complete
                ClearTransitionTimeout();
                _transitionTimeout = setTimeout(function() {

                    _transitionTimeout = null;

                    if (_currentlyShowing === note) {
                        _currentlyShowing = false;
                    }
                    self.ShowNext(); //move to next in queue

                }, _transitionDuration);
            };

            if (timeShown < note.minimumTimeToShow) {
                _deferredHideTimeout = setTimeout(function() {
                    _deferredHideTimeout = null;
                    onMinimumTimeShown();
                }, note.minimumTimeToShow - timeShown);
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
        ClearNotificationTimeouts();
    };

    return this;
});
