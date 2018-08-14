//bar from: https://loading.io/progress/
var cesProgressBar = (function(_wrapper, sytleConfig) {

    //private members
    var _self = this;
    var _bar = null;
    
    //public members

    this.Update = function(amount, total) {

        var percentage = (amount / total);

        console.log('Progress :' + amount + '/' + total + ' (' + (percentage) * 100 + '%)');
        
        _bar.set(percentage);
    };

    this.Reset = function() {
        for (var bar in bars) {
            bars[bar].set(0);
        }
    };

    //private methods

    var Constructor = (function() {

        $(document).ready(function() {

            //progress bar
            _bar = new ProgressBar.Line(_wrapper, {
                strokeWidth: 4,
                easing: 'easeInOut',
                duration: 100,
                color: '#00B7FF',
                trailColor: '#eee',
                trailWidth: 1,
                svgStyle: {width: '100%', height: '100%'}
            });
        });
    
    })();

    return this;

});