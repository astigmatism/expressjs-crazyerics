var cesSlidersInfo = (function(_config, $li, $panel) {

    var self = this;

    this.OnOpen = function(callback) {

        callback(true);
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    this.Activate = function(gameKey, info) {

        var $titleWrapper = $('#infosilderTitleScreen');
        //var $screen1 = $panel.find('img.screenshot1');
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

        var titlescreenPath = _config.paths.titlescreens + '/' + gameKey.system + '/' + encodeURIComponent(encodeURIComponent(gameKey.gk)) + '/0.jpg';
        var userContributedTitlescreenPath = _config.paths.contributions + '/titlescreens/' + gameKey.system + '/' + encodeURIComponent(encodeURIComponent(gameKey.gk)) + '/0.jpg';

        $titleWrapper.empty().hide();

        $.ajax({
            url: _config.paths.titlescreens,
            type: 'GET',
            crossDomain: true,
            data: { gk: gameKey.gk },
            cache: false,
            complete: function(response) {
            
                //in the case of an error, response comes back empty
                if (response.responseJSON) {
                    
                    var $img = $('<img src="data:image/jpg;base64,' + response.responseJSON + '" />');

                    $titleWrapper.imagesLoaded()
                    .done(function() {
                        $titleWrapper.show();
                    });

                    $titleWrapper.append($img);
                }
            }
        });

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