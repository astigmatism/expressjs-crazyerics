var TopSuggestions = (function() {

    var _self = this;
	
	$(document).ready(function() {

        $ul = $('#grid');

		$.each(boxFronts, function(title, details) {

            var $li = $('<li class="grid-item" data-title="' + title + '" />');

            if (currentTs[title]) {
                $li.addClass('selected');
            }

            $li.append('<div>' + title + '</div>');
            var $img = $('<img src="' + cdn + '/' + encodeURIComponent(details.gk) + '?w=116" />');
            $li.append($img);

            $img.imagesLoaded().done(function(imgLoad, image) {
                //_grid.isotope('layout');
            });

            $li.on('click', function() {
                $li.toggleClass('selected');

                if ($li.hasClass('selected')) {
                    $.ajax({
                        url: '/dev/ts/' + system,
                        type: 'PUT',
                        data: {
                            t: title
                        }
                      });
                }
                else {

                }

            });
            $ul.append($li);

        });
    });

})();
