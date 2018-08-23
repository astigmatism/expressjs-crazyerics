//bar from: https://loading.io/progress/
var cesProgressBar = (function(_Media, _gameKey, _wrapper, sytleConfig) {

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
    
    })();

    return this;
});