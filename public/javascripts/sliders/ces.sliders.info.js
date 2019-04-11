var cesSlidersInfo = (function(_config, $li, $panel) {

    var self = this;
    var _media = null;
    var _gameKey = null;
    var $titleWrapper = $('#infosilderTitleScreen');

    this.OnOpen = function(callback) {

        //on open, attempt to fetch new title screen
        if (_media && _gameKey) {
            //b is 320 width
            _media.TitleScreen($titleWrapper, _gameKey, 'b', function(success) {
                //not really anything I care about here. Either it loaded or it didn't
            }); 
        }

        callback(true);
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    this.Activate = function(gameKey, info, _Media) {

        _media = _Media;
        _gameKey = gameKey;

        var $overview = $panel.find('p.overview');
        var $genre = $panel.find('p.genre');
        var $release = $panel.find('p.release');
        var $publisher = $panel.find('p.publisher');
        var $developer = $panel.find('p.developer');
        var $players = $panel.find('p.players');

        $overview.empty();
        $genre.empty();
        $release.empty();
        $publisher.empty();
        $developer.empty();
        $players.empty();

        if (info) {

            if (info.Overview) {
                $overview.text(info.Overview);
            }

            if (info.Genres) {
                var genres = '';
                var genreArray = info.Genres.split(';'); //data seems to suggest this is the delimeter
                for (var genre in genreArray) {
                    genres += genreArray[genre] + ', ';
                }
                $genre.text('Genre: ' + genres.slice(0, -2));
            }

            if (info.ReleaseDate) {
                //convert
                var date = new Date(info.ReleaseDate);
                $release.text('Release Date: ' + $.format.date(date, 'ddd, MMMM dd, yyyy'));
            }

            if (info.Publisher) {
                $publisher.text('Publisher: ' + info.Publisher);
            }

            if (info.Developer) {
                $developer.text('Developer: ' + info.Developer);
            }

            if (info.Players) {
                $players.text('Players: ' + info.Players);
            }

            // if (info.AlternateTitles) {
            //     var titles = '';
            //     for (var title in info.Genres) {
            //         titles += info.Genres[AlternateTitles] + ',';
            //     }
            //     $panel.append('<p>Alternate Titles: ' + titles.slice(0, -1) + '</p>');
            // }
        }
    };

    this.Deactivate = function() {

        _gameKey = null;
        _media = null;
    };

    var Constructor = (function() {

    })();
});