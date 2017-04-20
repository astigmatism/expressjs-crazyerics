/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
var cesSavesManager = (function (_Compression) {

    var self = this;



    // var _savesData = {};
    // var _keys = [];
    // var _currentlyWrittenSaveData = {};

    // this.AddSave = function(saveType, key, statedata, screendetails, callback) {

    //     AddSaveToServer(saveType, key, statedata, screendetails, function (data) {
            
    //         //data coming back is formatted to help
    //         if (data && data.save && data.key) {

    //             //the server controls the maximum number of saves. if over the max, it will return the key to delete (usually the oldest save)
    //             if (data.deletekey) {
    //                 delete _savesData[data.deletekey];
    //             }

    //             //add save to local store, only do it after successful server response
    //             AddSave(saveType, data.key, data.save.state, data.save.screenshot);
    //         }

    //         if (callback) {
    //             callback();
    //         }
    //     })
    // };

    // this.GetMostRecentSaves = function(count) {

    //     result = {};
    //     for (var i = 0, len = _keys.length; i < len && i < count; ++i) {
    //         result[_keys[i]] = _savesData[_keys[i]];
    //     }
    //     return result;
    // };

    // this.WriteSaveStateFromSave = function(saveData, callback) {

    //     //simply save here :P
    //     _currentlyWrittenSaveData = saveData;
    //     if (callback) {
    //         callabck();
    //     }
    // };

    // var AddSave = function(saveType, key, stateData, screenshotData) {

    //     var screenshot  = _Compression.Unzip.bytearray(screenshotData);
    //     var state       = _Compression.Unzip.bytearray(stateData);

    //     key = parseInt(key, 10); //convert to int for this function
    //     //var time = $.format.date(key, 'ddd MM-dd-yyyy h:mma'); //using the jquery dateFormat plugin
    //     var time = $.format.date(key, 'MMM D h:mm:ss a'); //using the jquery dateFormat plugin

    //     _savesData[key] = {
    //         state: state,
    //         screenshot: screenshot,
    //         time: time,
    //         key: key,
    //         type: saveType
    //     };

    //     _keys.push(key); //store keys separately for sorting

    //     //newest to oldest
    //     _keys.sort(function(a, b) {
    //       return b - a;
    //     });
    // };


    // var AddSaveToServer = function(saveType, key, statedata, screendetails, callback) {

    //     //compression screen
    //     var screenshot = _Compression.Zip.bytearray(screendetails);

    //     //compress payload for server
    //     var data = _Compression.Zip.json({
    //         'state': statedata,
    //         'screenshot': screenshot,
    //         'type': saveType
    //     });

    //     $.ajax({
    //         url: '/states/save?key=' + encodeURIComponent(key),
    //         data: data,
    //         processData: false,
    //         contentType: 'text/plain',
    //         type: 'POST'
    //     })
    //     .done(function(data) {

    //         if (callback) {
    //             callback(data);
    //         }
    //     });
    // };

    // var Constructor = (function() {

    //     if (_initialSaveData) {

    //         for (type in _initialSaveData)
    //         {
    //             for (key in _initialSaveData[type]) {

    //                 AddSave(type, key, _initialSaveData[type][key].state, _initialSaveData[type][key].screenshot);
    //             }
    //         }
    //     }


    // })();
    
});
