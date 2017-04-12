/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPubSub = (function() {

    //private members
    var self = this;
    var _topics = {};
    
    //public members

    this.Publish = function(topic, args) {

        if (!_topics.hasOwnProperty(topic)) {
            return;
        }

        //call all handlers within the topic and pass the args along
        for (var i = 0, len = _topics[topic].length; i < len; ++i) {
            _topics[topic][i].apply(this, args);
        }

    };

    this.Subscribe = function(topic, handler) {

        //create topic
        if (!_topics.hasOwnProperty(topic)) {
            _topics[topic] = [];
        }

        //add a new handler to the topic
        var index = _topics[topic].push(handler);

        return function() {
            delete _topics[topic][index];
        }

    };

    this.Pub = this.Publish;
    this.Sub = this.Subscribe;

    return this;
});