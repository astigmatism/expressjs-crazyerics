/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPubSub = (function() {

    //private members
    var self = this;
    var _topics = {};
    var _muted = {};
    
    //public members

    this.Publish = function(topic, args) {

        if (!_topics.hasOwnProperty(topic)) {
            return;
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

    this.SubscribeOnce = function(topic, context, handler) {
        return Subscribe(topic, context, handler, 1);
    };

    var Subscribe = function(topic, context, handler, countdown) {

        //create topic
        if (!_topics.hasOwnProperty(topic)) {
            _topics[topic] = [];
        }

        //add a new handler to the topic
        var index = _topics[topic].push({
            handler: handler,
            context: context,
            countdown: countdown
        });

        return function() {
            delete _topics[topic][index];
        }
    }

    this.Pub = this.Publish;
    this.Sub = this.Subscribe;

    return this;
});