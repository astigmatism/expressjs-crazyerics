var cesProgressBar = (function(_wrapper) {

    //private members
    var self = this;
    var _bar = null;
    var _currentComplete = 0;
    var _buckets = {};
    
    //public members
    this.AddBucket = function(name, totalsize) {

        _buckets[name] = {
            'progress': 0,
            'total': totalsize
        }
    };

    this.Update = function(name, amount) {

        if (!_buckets.hasOwnProperty(name)) {
            return;
        }
        _buckets[name].progress = amount;
        Compute();
    };

    this.Reset = function() {
        _buckets = {};
        _bar.set(0);
        _currentComplete = 0;
    };

    //public methods

    $(document).ready(function() {

        //progress bar
        _bar = new ProgressBar.Line(_wrapper, {
            strokeWidth: 4,
            easing: 'easeInOut',
            duration: 1400,
            color: '#00B7FF',
            trailColor: '#eee',
            trailWidth: 1,
            svgStyle: {width: '100%', height: '100%'}
        });
    });

    //private methods

    var Compute = function() {

        var totalSize = 0;
        var totalProgress = 0;

        for (var name in _buckets) {
            totalSize += _buckets[name].total;
            totalProgress += _buckets[name].progress;
        }

        var percentage = (totalProgress / totalSize);

        console.log(percentage);

        _bar.set(_currentComplete); //a percentage to start from since .Animate cannot keep up sometimes
        //_bar.animate(percentage);
        _currentComplete = percentage;
    };

    return this;

});