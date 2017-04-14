/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
var cesSavesManager = (function (_Compression, _initialSaveData) {

    var self = this;
    
    /*
    {
        user: {
            12345: {...}
            54321: {...}
        },
        auto: {
            13245: {...}
        }
    }
     */
    var _savesData = {};
    
    //for keys, I need to keep them in arrays so I can sort them by date
    /*
    {
        user: [12345, 54321],
        auto: [13245]
    }
     */
    var _keys = {};

    this.AddSave = function(saveType, key, statedata, screendetails, callback) {

        AddSaveToServer(saveType, key, statedata, screendetails, function (data) {
            
            //data coming back is formatted to help
            if (data && data.save && data.key) {

                //the server controls the maximum number of saves. if over the max, it will return the key to delete (usually the oldest save)
                if (data.deletekey) {
                    delete _savesData[data.deletekey];
                }

                //add save to local store, only do it after successful server response
                AddSave(saveType, data.key, data.save.state, data.save.screenshot);
            }

            if (callback) {
                callback();
            }
        })
    };

    this.GetSaves = function(type, maxCount) {
        
        maxCount = maxCount || Infinity;
        var result = [];

        if (_keys[type]) {

            for(var i = 0, len = _keys[type].length; i < len && i < maxCount; ++i) {
                result.push(_savesData[type][_keys[type][i]]);
            }
        }
        return result;
    };

    var AddSave = function(saveType, key, stateData, screenshotData) {

        var screenshot  = _Compression.Unzip.bytearray(screenshotData);
        var state       = _Compression.Unzip.bytearray(stateData);

        key = parseInt(key, 10); //convert to int for this function
        //var time = $.format.date(key, 'ddd MM-dd-yyyy h:mma'); //using the jquery dateFormat plugin
        var time = $.format.date(key, 'MMM D h:mma'); //using the jquery dateFormat plugin

        _savesData[saveType] = _savesData[saveType] ? _savesData[saveType] : {}; //create type object
        _keys[saveType] = _keys[saveType] ? _keys[saveType] : [];

        _savesData[saveType][key] = {
            state: state,
            screenshot: screenshot,
            time: time,
            key: key
        };

        _keys[saveType].push(key);

        //newest to oldest
        _keys[saveType].sort(function(a, b) {
          return b - a;
        });
    };


    var AddSaveToServer = function(saveType, key, statedata, screendetails, callback) {

        //compression screen
        var screenshot = _Compression.Zip.bytearray(screendetails);

        //compress payload for server
        var data = _Compression.Zip.json({
            'state': statedata,
            'screenshot': screenshot,
            'type': saveType
        });

        $.ajax({
            url: '/states/save?key=' + encodeURIComponent(key),
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

            for (type in _initialSaveData)
            {
                for (key in _initialSaveData[type]) {

                    AddSave(type, key, _initialSaveData[type][key].state, _initialSaveData[type][key].screenshot);
                }
            }
        }


    })();
    
});
