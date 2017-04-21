/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
var cesSavesManager = (function (_Compression, _gameKey, _initialSaveData) {

    var self = this;
    var _savesData = {};
    var _timeStamps = [];
    var _currentlyWrittenSaveData = {};

    this.AddSave = function(saveType, screenDataUnzipped, stateDataUnzipped, callback) {

        AddSaveToServer(saveType, screenDataUnzipped, stateDataUnzipped, function (data) {
            
            //data coming back is formatted to help
            if (data && data.ts) {

                //the server controls the maximum number of saves. if over the max, it will return the timeStamp to delete (usually the oldest save)
                if (data.ds) {
                    delete _savesData[data.ds];
                }

                //add save to local store, only do it after successful server response
                AddSave(saveType, data.ts, screenDataUnzipped, stateDataUnzipped);
            }

            if (callback) {
                callback();
            }
        })
    };

    this.GetMostRecentSaves = function(count) {

        result = {};
        for (var i = 0, len = _timeStamps.length; i < len && i < count; ++i) {
            result[_timeStamps[i]] = _savesData[_timeStamps[i]];
        }
        return result;
    };

    this.GetState = function(timeStamp, callback) {

        //two possibilities here, we either have the state data already or we need to go and get it
        if (!_savesData.hasOwnProperty(timeStamp)) {
            callback('The property ' + timeStamp + ' does not exist in client-stored save data');
            return;
        }

        if (_savesData[timeStamp].state) {
            callback(null, _savesData[timeStamp].state);
            return;
        }
        //don't have it! go and get it
        $.ajax({
            url: '/states?gk=' + encodeURIComponent(_gameKey) + '&timeStamp=' + timeStamp,
            contentType: 'text/plain',
            type: 'GET'
        })
        .done(function(data) {
            if (data.error) {
                callback(data.error);
                return;
            }

            if (callback && data.state) {

                var stateDataUnzipped = _Compression.Unzip.bytearray(data.state);

                //now that we have it, append it to the existing local data
                _savesData[timeStamp].state = stateDataUnzipped;

                callback(null, stateDataUnzipped);
            }
        });
    };  

    //on incoming data, state will be null since we don't need to store all states initially.
    //as saves are added here (or we retirve state data), state data will be included
    var AddSave = function(type, timeStamp, screenDataUnzipped, stateDataUnzipped) {

        timeStamp = parseInt(timeStamp, 10); //convert to int for this function
        //var time = $.format.date(timeStamp, 'ddd MM-dd-yyyy h:mma'); //using the jquery dateFormat plugin
        var time = $.format.date(timeStamp, 'MMM D h:mm:ss a'); //using the jquery dateFormat plugin

        _savesData[timeStamp] = {
            screenshot: screenDataUnzipped,
            state: stateDataUnzipped,
            time: time,
            timeStamp: timeStamp,
            type: type
        };

        _timeStamps.push(timeStamp); //store timestamps separately for sorting

        //newest to oldest
        _timeStamps.sort(function(a, b) {
          return b - a;
        });
    };


    var AddSaveToServer = function(type, screenDataUnzipped, stateDataUnzipped, callback) {

        //compression screen
        var screenDataZipped = _Compression.Zip.bytearray(screenDataUnzipped);
        var stateDataZipped = _Compression.Zip.bytearray(stateDataUnzipped);

        //compress payload for server
        var data = _Compression.Zip.json({
            'state': stateDataZipped,
            'screenshot': screenDataZipped,
            'type': type
        });

        $.ajax({
            url: '/states/save?gk=' + encodeURIComponent(_gameKey),
            data: data,
            processData: false,
            contentType: 'text/plain',
            type: 'POST'
        })
        .done(function(data) {

            if (callback) {
                callback(data);
            }
        });
    };

    var Constructor = (function() {

        if (_initialSaveData) {

            for (var i = 0, len = _initialSaveData.length; i < len; ++i) {
                var item = _initialSaveData[i];
                
                if (item.type && item.screen && item.timeStamp) {

                    var screenDataUnzipped  = _Compression.Unzip.bytearray(item.screen);

                    AddSave(item.type, item.timeStamp, screenDataUnzipped, null);
                }
            }
        }


    })();
    
});
