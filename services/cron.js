'use strict';
const config = require('config');
const cron = require('node-cron');

//https://www.npmjs.com/package/node-cron

/*
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
 */

module.exports = new (function() {

    const _self = this;

    this.Schedule = function(definition, handler, opt_RunOnStart) {

        //run on start
        if (opt_RunOnStart) {
            handler();
        }

        if (!definition) {
            definition = '* * * * *';
        }
        return cron.schedule(definition, handler);
    };

    this.EverySecond = function(seconds, handler, opt_RunOnStart) {
        return _self.Schedule('*/' + seconds + ' * * * * *', handler, opt_RunOnStart);
    };

    this.EveryMinute = function(minutes, handler, opt_RunOnStart) {
        return _self.Schedule('*/' + minutes + ' * * * *', handler, opt_RunOnStart);
    };

    this.EveryHour = function(hours, handler, opt_RunOnStart) {
        return _self.Schedule('* */' + hours + ' * * *', handler, opt_RunOnStart);
    };

    this.RandomEveryHour = function(handler, opt_RunOnStart) {
        return _self.Schedule(GetRandomArbitrary(0, 59) + ' * * * *', handler, opt_RunOnStart);
    };

    this.RandomEveryMinute = function(handler, opt_RunOnStart) {
        return _self.Schedule(GetRandomArbitrary(0, 59) + ' * * * * *', handler, opt_RunOnStart);
    };

    //Returns a random integer between min (inclusive) and max (inclusive)
    var GetRandomArbitrary = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
})();
