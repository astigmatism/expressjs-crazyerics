var cesSlidersInfo = (function(_config, $li, $panel) {

    var self = this;

    this.OnOpen = function(callback) {

        callback(true);
    };

    this.OnClose = function(callback) {

        callback(true);
    };

    this.Activate = function(gameKey, info) {

        $panel.empty();

        if (info) {

            if (info.Genres) {
                var genres = '';
                for (var genre in info.Genres) {
                    genres += info.Genres[genre] + ', ';
                }
                $panel.append('<p>Genres: ' + genres.slice(0, -2) + '</p>');
            }

            if (info.Overview) {
                $panel.append('<p>' + info.Overview + '</p>');
            }

            if (info.ReleaseDate) {
                $panel.append('<p>Release Date: ' + info.ReleaseDate + '</p>');
            }

            if (info.Publisher) {
                $panel.append('<p>Publisher: ' + info.Publisher + '</p>');
            }

            if (info.Developer) {
                $panel.append('<p>Developer: ' + info.Developer + '</p>');
            }

            if (info.Players) {
                $panel.append('<p>Players: ' + info.Players + '</p>');
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

    var Constructor = (function() {

    })();
});