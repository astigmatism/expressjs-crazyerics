/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesGameLink = (function(config, _Compression, PlayGame, system, title, file, size, includeRemove) {

    //private members
    var self = this;
    var _gamelink;
    var _imagewrapper;
    var _image;
    var _remove;
    var _onRemove = null;

    //public members

    this.GetDOM = function() {
        return _gamelink;
    };

    this.OnRemoveClick = function(operation) {
        _onRemove = operation;
    };

    this.DisableAllEvents = function() {

        $(_gamelink).find('*').off();
    };

    /**
     * a common function to return to the jquery object of a box front image. includes onerror handler for loading generic art when box not found
     * @param  {string} system
     * @param  {string} title
     * @param  {number} size   size of the box art (114, 150...)
     * @return {Object}        jquery img
     */
    var GetBoxFront = function(system, title, size) {


        //have box title's been compressed (to obfiscate on cdn)
        if (config.flattenedboxfiles) {
            //double encode, once for the url, again for the actual file name (files saved with encoding becase they contain illegal characters without)
            title = encodeURIComponent(encodeURIComponent(_Compression.In.string(title)));
        }

        //incldes swap to blank cart onerror
        return $('<img onerror="this.src=\'' + config.assetpath + '/images/blanks/' + system + '_' + size + '.png\'" src="' + config.boxpath + '/' + system + '/' + config.systemdetails[system].boxcdnversion + '/' + title + '/' + size + '.jpg" />');
    };

    var Constructor = (function() {

        includeRemove = includeRemove || false;

        var $div = $('<div class="gamelink"></div>');
        var $box = GetBoxFront(system, title, size);

        $box.addClass('tooltip close');
        $box.attr('title', title);

        //show box art when finished loading
        $box.load(function() {
            $(this)
            .removeClass('close')
            .on('mousedown', function() {
                preventGamePause = true; //prevent current game from pausng before fadeout
            })
            .on('mouseup', function() {

                PlayGame(system, title, file);
                window.scrollTo(0, 0);
            });
        });

        var $imagewrapper = $('<div class="box zoom close"></div>');

        $imagewrapper.append($box);

        //also when box load fails, in addition to showing the blank cartridge, let's create a fake label for it
        $box.error(function(e) {
            $(this).parent().append('<div class="boxlabel boxlabel-' + system + '"><p>' + title + '</p></div>');
        });

        $div.append($imagewrapper);

        var $remove = null;

        //if including a remove button
        if (includeRemove) {
            $remove = $('<div class="remove tooltip" title="Remove this game and all saved progress"></div>');
            
            //attach event 
            $remove.on('click', function() {
                if (_onRemove) {
                    _onRemove();
                }
            });

            $imagewrapper.append($remove)
            
            //show remove on mouse over
            $imagewrapper
                .on('mouseover', function() {
                    $remove.show();
                })
                .on('mouseout', function() {
                    $remove.hide();
                });
        }

        _gamelink = $div;
        _imagewrapper = $imagewrapper;
        _image = $box;
        _remove = $remove;
    })();

    return this;

});