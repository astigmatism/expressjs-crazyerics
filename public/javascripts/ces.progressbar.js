//bar from: https://loading.io/progress/
var cesProgressBar = (function(_Images, _gameKey, _wrapper, sytleConfig) {

    //private members
    var _self = this;
    var _bar = null;
    
    //public members

    this.Update = function(amount, total) {
        
        var ratio = (amount / total);
        var percentage = Math.ceil(ratio * 100);
        //console.log('Progress :' + amount + '/' + total + ' (' + (percentage) * 100 + '%)');
        //_bar.set(percentage);

        return percentage;
    };

    //private methods

    var Constructor = (function() {
        
        // _bar = new ProgressBar.Line(_wrapper, {
        //     strokeWidth: 4,
        //     easing: 'easeInOut',
        //     duration: 100,
        //     color: '#00B7FF',
        //     trailColor: '#eee',
        //     trailWidth: 1,
        //     svgStyle: {width: '100%', height: '100%'}
        // });
    
    })();

    return this;

});