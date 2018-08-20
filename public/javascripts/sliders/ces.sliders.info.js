var cesSlidersInfo = (function(_config, $li, $panel) {

    var self = this;
    var _images = null;
    var _gameKey = null;
    var $titleWrapper = $('#infosilderTitleScreen');

    this.OnOpen = function(callback) {

        //on open, attempt to fetch new title screen
        if (_images && _gameKey) {
            _images.TitleScreen($titleWrapper, _gameKey, 'b', function(success) {
                //not really anything I care about here. Either it loaded or it didn't
            });
        }

        callback(true);
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    this.Activate = function(gameKey, info, _Images) {

        _images = _Images;
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
                for (var genre in info.Genres) {
                    genres += info.Genres[genre] + ', ';
                }
                $genre.text('Genre: ' + genres.slice(0, -2));
            }

            if (info.ReleaseDate) {
                $release.text('Release Date: ' + info.ReleaseDate);
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
        _images = null;
    };

    var Constructor = (function() {

    })();
});