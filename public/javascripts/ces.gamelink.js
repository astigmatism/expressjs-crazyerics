var cesGameLink = (function(_config, _Media, _Tooltips, gameKey, cdnPathValue, opt_tooltip, opt_PlayGame, opt_OnImageLoaded, opt_AddToCollection) {

    //private members
    var self = this;
    var _gamelink;

    //public members

    this.GetDOM = function() {
        return _gamelink;
    };
    
    this.DisableAllEvents = function() {

        $(_gamelink).find('*').off();
    };

    var Constructor = (function() {

        var _self = this;

        var $div = $('<div class="gamelink"></div>');
        var $imagewrapper = $('<div class="box zoom transparent"></div>');

        //zoom on click, if zoomed (selected, trigger play)
        $div.on('click', function() {

            // if (opt_PlayGame && $imagewrapper.hasClass('zoom-on')) {
            //     _Tooltips.Close($imagewrapper); //sometimes the tooltip was staying up after clicking
            //     opt_PlayGame(gameKey);
            // }

            $imagewrapper.removeClass('zoom-on');
            $imagewrapper.addClass('zoom-down');

        }).on('mouseover', function() {
            $imagewrapper.addClass('zoom-on');
        })
        .on('mouseout', function() {
            $imagewrapper.removeClass('zoom-on');
            $imagewrapper.removeClass('zoom-down');
        });

        var $img = _Media.$BoxFront(gameKey, cdnPathValue);

        $img.imagesLoaded().progress(function(imgLoad, image) {
            
            //$imagewrapper.removeClass('close'); //remove close on parent to reveal image
            $imagewrapper.removeClass('transparent').cssAnimation('flipInY', 1000);

            if (opt_OnImageLoaded) {
                opt_OnImageLoaded(image);
            }
        });
        
        $imagewrapper.append($img);

        if (opt_tooltip) {

            //generate new toolips content
            var $tooltipContent = $('<div class="gamelink-tooltip" />');
            $tooltipContent.append('<div class="tooltiptitle">' + gameKey.title + '</div>');
            var $mediawrapper = $('<div class="mediawrapper"></div>');
            $tooltipContent.append($mediawrapper);

            /*
            
            should future eric ever find this, I attempted a "add to collection" from the suggestions
            area on 11-9-2020 (COVID!). I havent worked on ces in over a year and I just couldn't make it 
            happen. It appears the title is added to the current collection but the payload always returns
            that it didn't :( Not going any further on this, why? Because games from the search bar are
            play immediately and wont have a "add to collection" feature (yet)

            var $addbutton = $('<span class="button add noselect">Add to Collection</span>');
            $addbutton.click(function(e) { 
                opt_AddToCollection(gameKey);
            });
            $tooltipContent.append($addbutton);
            */

            var $playbutton = $('<span class="button play noselect">Play Now!</span>');
            $playbutton.click(function(e) { 

                _Tooltips.Close($imagewrapper); //sometimes the tooltip was staying up after clicking
                opt_PlayGame(gameKey);
            });
            $tooltipContent.append($playbutton);

            _Tooltips.SingleHTMLWithTitleScreen($imagewrapper, $tooltipContent, $mediawrapper, gameKey, true);
        }

        $div.append($imagewrapper);

        _gamelink = $div; //save to the instance for manipulation later        
    })();

    return this;

});
