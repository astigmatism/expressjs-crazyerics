/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPubSub = (function(_Logging) {

    //private members
    var self = this;
    var _topics = {};
    var _muted = {};
    var _sustained = {};
    var _debug = false; //when true, console logging
    
    //public members

    this.Publish = function(topic, args, _optSustained) {

        _Logging.Console('cesPubSub', 'topic published: ' + topic, args);

        //sustained means that anytime anyone subscribes to this topic, 
        //a previously publish to the topic is saved and published back to that listener
        if (_optSustained) {
            _sustained[topic] = args;
        }

        //if a topic is not subscribed to, throw away publish
        if (!_topics.hasOwnProperty(topic)) {
            return;
        }

        if (_debug) {
            console.log('PUBLISH: ' + topic, args);
        }

        var itemsToDelete = [];

        //call all handlers within the topic and pass the args along
        _topics[topic].forEach(function(item, index) {
            item.handler.apply(item.context, args);

            //if countdown to delete, mark down. null would be a sub that exists forever
            if (item.countdown) {
                item.countdown--;

                if (item.countdown === 0) {
                    itemsToDelete.push(index);
                }
            }
        });

        itemsToDelete.forEach(function (item) {
            delete _topics[topic][item];
        });
    };

    this.Subscribe = function(topic, context, handler) {

        return Subscribe(topic, context, handler);

    };

    this.SubscribeOnce = function(topic, context, handler, exclusive) {
        
        //if exclusive, that means we only have one listener
        if (exclusive) {
            self.Unsubscribe(topic); //remove all topics
        }

        return Subscribe(topic, context, handler, 1);
    };

    //for this, maintain a subscription for a given time and then destory it. handler will take boolean if topic was published or not
    this.SubscribeOnceWithTimer = function(topic, context, handler, failureHandler, exclusive, ttl) {

        var removeFunc = self.SubscribeOnce(topic, context, handler, exclusive);

        setTimeout(function() {
            
            //if function returns true, it indicates the topic was just removed meaning the topic was never published
            //if false, then it indicates that the topic was removed at the time it was published (since this is a subscribe once)
            if (removeFunc()) {
                failureHandler();
            }
        }, ttl);

        return removeFunc;
    };

    this.Unsubscribe = function(topic) {

        if (!_topics.hasOwnProperty(topic)) {
            return;
        }
        delete _topics[topic];
    };

    this.Mute = function(topic) {

        if (!_topics.hasOwnProperty(topic)) {
            return;
        }

        _muted[topic] = _topics[topic];
        delete _topics[topic];
    };

    this.Unmute = function(topic) {

        if (!_muted.hasOwnProperty(topic)) {
            return;
        }
        _topics[topic] = _muted[topic];
        delete _muted[topic];
    };

    var Subscribe = function(topic, context, handler, countdown) {

        //create topic
        if (!_topics.hasOwnProperty(topic)) {
            _topics[topic] = [];
        }

        //add a new handler to the topic, push returns new length of array, index is -1
        var index = _topics[topic].push({
            handler: handler,
            context: context,
            countdown: countdown
        });
        --index;

        //if topic has been sustained, publish it again now
        if (topic in _sustained) {
            self.Publish(topic, _sustained[topic])
        }

        //we can use this to allow a sub to remove itself, check first since I could have removed it through unsub
        return function() {

            if (!_topics.hasOwnProperty(topic)) {
                
                return false; //false indicating not found, previously deleted
            }
            if (_topics[topic].hasOwnProperty(index)) {
                
                delete _topics[topic][index];
                return true; //true indicating the topic was deleted from this function
            }
            return null;
        };
    };

    this.Pub = this.Publish;
    this.Sub = this.Subscribe;

    return this;
});