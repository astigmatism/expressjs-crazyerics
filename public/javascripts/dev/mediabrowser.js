var cesdevMediaBrowser = (function() {

    var _self = this;
	
	$(document).ready(function() {

        $ul = $('#list');

		$.each(masterFile, function(title, details) {

            var bestFile = details.b;
            var bestFileGk = details.f[details.b].gk;
            var bestFileRank = details.f[details.b].rank;

            var styleClass = (bestFileRank >= 400) ? 'green' : (bestFileRank >= 250 ? 'yellow' : 'red');

            var $li = $('<li data-title="' + title + '" />');

            // if (currentTs[title]) {
            //     $li.addClass('selected');
            // }

            //let go ahead and generate these 50 height images on the cdn
            var $img = $('<img src="' + paths.box + '/front/b/' + encodeURIComponent(bestFileGk) + '" />');
            $li.append($img);


            $li.append('<h3>' + title + '</h3>');

            // $img = $('<img src="' + paths.box + '/front/' + encodeURIComponent(bestFileGk) + '?location=media" />');
            // $li.append($img);

            
            // $li.append('<div>' + details.score + '</div>');
            // $li.append('<div> cdn rank: ' + details.rank + '</div>');

            // $img.imagesLoaded().done(function(imgLoad, image) {
            //     //_grid.isotope('layout');
            // });

            // $li.on('click', function() {
            //     $li.toggleClass('selected');

            //     $.ajax({
            //         url: '/dev/ts/' + system,
            //         type: $li.hasClass('selected') ? 'PUT' : 'DELETE',
            //         data: {
            //             t: title
            //         }
            //     });

            // });
            $ul.append($li);

        });
    });

})();
