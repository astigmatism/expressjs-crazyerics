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

        ClearInfoFields($overview, [$genre, $release, $publisher, $developer, $players]);

        if (info) {

            SetOverview($overview, info.Overview);

            if (info.Genres) {
                SetMetaRow($genre, 'Genre', FormatGenres(info.Genres));
            }

            if (info.ReleaseDate) {
                SetMetaRow($release, 'Release Date', FormatReleaseDate(info.ReleaseDate));
            }

            if (info.Publisher) {
                SetMetaRow($publisher, 'Publisher', info.Publisher);
            }

            if (info.Developer) {
                SetMetaRow($developer, 'Developer', info.Developer);
            }

            if (info.Players) {
                SetMetaRow($players, 'Players', info.Players);
            }

            // if (info.AlternateTitles) {
            //     var titles = '';
            //     for (var title in info.Genres) {
            //         titles += info.Genres[AlternateTitles] + ',';
            //     }
            //     $panel.append('<p>Alternate Titles: ' + titles.slice(0, -1) + '</p>');
            // }
        }
        else {
            SetOverview($overview, null);
        }
    };

    this.Deactivate = function() {

        _gameKey = null;
        _media = null;
        $titleWrapper.empty();
        ClearInfoFields($panel.find('p.overview'), [
            $panel.find('p.genre'),
            $panel.find('p.release'),
            $panel.find('p.publisher'),
            $panel.find('p.developer'),
            $panel.find('p.players')
        ]);
    };

    var ClearInfoFields = function($overview, metadataRows) {

        $overview.empty().removeClass('missing').show();

        for (var i = 0; i < metadataRows.length; i++) {
            metadataRows[i].empty().hide();
        }
    };

    var SetOverview = function($overview, overview) {

        if (overview) {
            $overview.text(overview).removeClass('missing');
        }
        else {
            $overview.text('No description is available for this game yet.').addClass('missing');
        }
    };

    var SetMetaRow = function($row, label, value) {

        if (!value) {
            $row.empty().hide();
            return;
        }

        $row.empty();
        $row.append($('<span />').addClass('info-meta-label').text(label));
        $row.append($('<span />').addClass('info-meta-value').text(value));
        $row.show();
    };

    var FormatGenres = function(genres) {

        var genreArray = genres.split(';'); //data seems to suggest this is the delimeter
        var cleanGenres = [];
        var genre;

        for (var i = 0; i < genreArray.length; i++) {
            genre = $.trim(genreArray[i]);

            if (genre) {
                cleanGenres.push(genre);
            }
        }

        return cleanGenres.join(', ');
    };

    var FormatReleaseDate = function(releaseDate) {

        var date = new Date(releaseDate);

        if (!isNaN(date.getTime())) {
            return $.format.date(date, 'ddd, MMMM dd, yyyy');
        }

        return releaseDate;
    };

    var Constructor = (function() {

    })();
});
