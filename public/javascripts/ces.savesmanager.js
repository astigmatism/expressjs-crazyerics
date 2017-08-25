/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
var cesSavesManager = (function (_config, _Compression, _gameKey, _initialSaveData) {

    var self = this;
    var _savesData = {};
    var _timestamps = [];
    var _currentlyWrittenSaveData = {};

    this.AddSave = function(saveType, screenDataUnzipped, stateDataUnzipped, callback) {

        AddSaveToServer(saveType, screenDataUnzipped, stateDataUnzipped, function (data) {
            
            //data coming back is formatted to help
            if (data && data._) {

                //the server controls the maximum number of saves. if over the max, it will return the timestamp to delete (usually the oldest save)
                if (data.__) {
                    delete _savesData[parseInt(data.__, 10)];
                }

                //add save to local store, only do it after successful server response
                AddSave(saveType, data._.timestamp, screenDataUnzipped, stateDataUnzipped);
            }

            if (callback) {
                callback();
            }
        })
    };

    this.GetMostRecentSaves = function(count, type) {

        result = {};
        for (var i = 0, len = _timestamps.length; i < len && i < count; ++i) {
            
            if (type && type != _savesData[_timestamps[i]].type) {
                continue;
            }

            result[_timestamps[i]] = {
                save: _savesData[_timestamps[i]],
                i: i,
                total: len
            }
        }
        return result;
    };

    //returns the state of how close we are to maximum saves for this game. returned as string or null
    this.MaximumSavesCheck = function() {

        if (_timestamps.length >= _config.maxSavesPerGame) {
            return 'max';
        }
        if (_timestamps.length >= (_config.maxSavesPerGame - (_config.maxSavesPerGame * 0.2))) {
            return 'near';
        }
        return null;
    };

    this.GetState = function(timestamp, callback) {

        //two possibilities here, we either have the state data already or we need to go and get it
        if (!_savesData.hasOwnProperty(timestamp)) {
            callback('The property ' + timestamp + ' does not exist in client-stored save data');
            return;
        }

        if (_savesData[timestamp].state) {
            callback(null, _savesData[timestamp].state);
            return;
        }
        //don't have it! go and get it
        $.ajax({
            url: '/saves?_=' + timestamp, //we'll attach userid to the lookup for extra security
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
                _savesData[timestamp].state = stateDataUnzipped;

                callback(null, stateDataUnzipped);
            }
        });
    };  

    var AddSave = function(type, timestamp, screenDataUnzipped, stateDataUnzipped) {

        timestamp = parseInt(timestamp, 10);
        var time = $.format.date(timestamp, 'MMM D h:mm:ss a'); //using the jquery dateFormat plugin

        _savesData[timestamp] = {
            screenshot: screenDataUnzipped,
            state: stateDataUnzipped,
            time: time,
            timestamp: timestamp,
            type: type
        };

        _timestamps.push(timestamp); //store timestamps separately for sorting

        //newest to oldest
        _timestamps.sort(function(a, b) {
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
            'type': type,
            'timestamp': Date.now() //now because this is the moment the player (with timezone) understands when they saved
        });

        $.ajax({
            url: '/saves?gk=' + encodeURIComponent(_gameKey.gk),
            data: data,
            processData: false,
            contentType: 'text/plain',
            type: 'POST'
        })
        .done(function(data) {
            callback(data); //formatted as json from server
        });
    };

    var Constructor = (function() {

        if (_initialSaveData) {

            for (var i = 0, len = _initialSaveData.length; i < len; ++i) {
                var item = _initialSaveData[i];
                
                //sanity check for all expected initial save properties
                if (item.type && item.screenshot && item.timestamp) {

                    var screenDataUnzipped  = _Compression.Unzip.bytearray(item.screenshot);

                    AddSave(item.type, item.timestamp, screenDataUnzipped, null);
                }
            }
        }


    })();
    
});
