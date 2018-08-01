var cesSlidersInfo = (function(_config, $li, $panel) {

    var self = this;

    this.OnOpen = function(callback) {

        callback(true);
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    this.Activate = function(gameKey, info) {

        var $title = $panel.find('img.title');
        var $screen1 = $panel.find('img.screenshot1');
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
        
        var titlescreenPath = _config.paths.titlescreens + '/' + encodeURIComponent(encodeURIComponent(gameKey.gk)) + '/0.jpg';

        $title.hide();
        $title.imagesLoaded().done(function() {
            $title.show(); //remove close on parent to reveal image
        });
        $title.attr('src', titlescreenPath);

        $screen1.hide();
        $screen1.imagesLoaded().done(function() {
            $screen1.show(); //remove close on parent to reveal image
        });
        $screen1.attr('src',_config.paths.images + '/screenshot1/' + gameKey.system + '/' + gameKey.title + '/original.jpg');

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

    };

    var Constructor = (function() {

    })();
});