var cesProgressBar = (function(_wrapper) {

    //private members
    var self = this;
    var _bar = null;
    var _currentComplete = 0;
    
    //public members

    this.Animate = function(percentage) {

        //to prevent the bar from animating down
        if (percentage < _currentComplete) {
            return;
        }

        _bar.animate(percentage);
        _currentComplete = percentage;
    };

    this.Reset = function() {
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
            color: '#33ba2e',
            trailColor: '#eee',
            trailWidth: 1,
            svgStyle: {width: '100%', height: '100%'}
        });
    });

    return this;

});