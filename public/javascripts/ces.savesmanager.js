/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
var cesSavesManager = (function (_Compression, _initialSaveData) {

    var self = this;
    var _savesData = {};
    var _keys = [];

    this.AddSave = function(key, statedata, screendetails, callback) {

        AddSaveToServer(key, statedata, screendetails, function (data) {
            
            if (data && data.save && data.key) {

                //the server controls the maximum number of saves. if over the max, it will return the key to delete (usually the oldest save)
                if (data.deletekey) {
                    delete _savesData[data.deletekey];
                }

                AddSave(data.key, data.save.state, data.save.screenshot);
            }

            if (callback) {
                callback();
            }
        })
    };

    this.GetSave = function(key) {

        if (!_savesData.hasOwnProperty(key)) {
            return null;
        }

        return _savesData[key];
    };

    this.GetSaves = function() {
        
        var result = [];

        for(var i = 0, len = _keys.length; i < len; ++i) {
            result.push(_savesData[_keys[i]]);
        }

        return result;
    };

    var AddSave = function(key, stateData, screenshotData) {

        var screenshot  = _Compression.Unzip.bytearray(screenshotData);
        var state       = _Compression.Unzip.bytearray(stateData);

        key = parseInt(key, 10); //convert to int for this function
        //var time = $.format.date(key, 'ddd MM-dd-yyyy h:mma'); //using the jquery dateFormat plugin
        var time = $.format.date(key, 'MMM D h:mma'); //using the jquery dateFormat plugin

        _savesData[key] = {
            state: state,
            screenshot: screenshot,
            time: time,
            key: key
        };

        _keys.push(key);

        //newest to oldest
        _keys.sort(function(a, b) {
          return b - a;
        });
    };


    var AddSaveToServer = function(key, statedata, screendetails, callback) {

        //compression screen
        var screenshot = _Compression.Zip.bytearray(screendetails);

        //compress payload for server
        var data = _Compression.Zip.json({
            'state': statedata,
            'screenshot': screenshot
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

            for (savedate in _initialSaveData) {

                AddSave(savedate, _initialSaveData[savedate].state, _initialSaveData[savedate].screenshot);
            }
        }


    })();
    
});





/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
// var cesState = (function (_Compression, _initialStateData) {

//     //private members
//     var self = this;
//     var data = _initialStateData; //we modify data, so keep initial separate

//     //public methods

//     /**
//      * Reutns as an array, the slots which hold saved state data
//      * @return {Array}
//      */
//     this.GetSavedSlots = function() {
//         return Object.keys(data);
//     };

//     /**
//      * Given a slot, returns image data
//      * @param  {number} slot
//      * @return {Object}   
//      */
//     this.GetScreenshot = function(system, slot) {
//         return screenshot = _Compression.Unzip.bytearray(data[slot].screenshot);
//     };

//     /**
//      * Given a slot, returns a formatted date string
//      * @param  {number} slot
//      * @return {string}    
//      */
//     this.GetDate = function(slot) {
//         if (data[slot] && data[slot].hasOwnProperty('time')) {
//             var date = new Date(data[slot].time);
//             var formatteddate = $.format.date(date, 'ddd MM-dd-yyyy hmma'); //using the jquery dateFormat plugin
//             return formatteddate;
//         }
//         return null;
//     };

//     this.GetStatesForFS = function() {

//         var result = [];
//         var slots = Object.keys(data);
//         var i = slots.length;

//         while (i--) {
//             result[i] = _Compression.Unzip.bytearray(data[slots[i]].state);
//         }
//         return result;
//     };

//     *
//      * saves state to server
//      * @param  {Object} statedetails
//      * @param  {Object} screendetails
//      * @return {undef}               
     
//     this.SaveStateToServer = function(statedetails, screendetails, callback) {

//         //state details is a resolve on a deferred. all return data in array
//         var key = statedetails[0];
//         var system = statedetails[1];
//         var title = statedetails[2];
//         var file = statedetails[3];
//         var slot = statedetails[4];
//         var statedata = statedetails[5];

//         var screenshot = _Compression.Zip.bytearray(screendetails);

//         //compress payload for server
//         var data = _Compression.Zip.json({
//             'state': statedata,
//             'screenshot': screenshot
//         });

//         $.ajax({
//             url: '/states/save?key=' + encodeURIComponent(key) + '&slot=' + slot,
//             data: data,
//             processData: false,
//             contentType: 'text/plain',
//             type: 'POST',
//             /**
//              * on completion of state save
//              * @param  {string} data
//              * @return {undef}
//              */
//             complete: function(data) {

//                 //when complete, we have something to load. show in recently played
//                 var statedetails = {};
//                 statedetails[slot] = {
//                     time: Date.now(),
//                     screenshot: screenshot
//                 };

//                 if (callback) {
//                     callback(key, system, title, file, null, statedetails);
//                 }
//             }
//         });
//     };

//     return this;

// });