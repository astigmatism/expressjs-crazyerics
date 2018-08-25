var cesdevMediaBrowser = (function() {

    var _self = this;
    
	$(document).ready(function() {

        
        Generate(masterFile);

        $('#search').on('keyup', function(event) {

            var input = event.currentTarget.value;
            if (input.length > 1) {

                //filter based on search term
                var set = {};
                var loose = {};
                $.each(masterFile, function(key, value) {
                    
                    var regex = new RegExp('^' + input + '.*', 'i');
                    var regex2 = new RegExp('.*' + input + '.*', 'i');
                    
                    if (key.match(regex)) {
                        set[key] = value;
                    } else if (key.match(regex2)) {
                        loose[key] = value;
                    }
                });
                $.extend(set, loose);

                Generate(set);
            }
        });

        $('#hidered').click(function() {
			if ($(this).is(':checked')) {
				$('li.red').hide();
			} else {
				$('li.red').show();
			}
        });
        
        $('#hideyellow').click(function() {
			if ($(this).is(':checked')) {
				$('li.yellow').hide();
			} else {
				$('li.yellow').show();
			}
		});

		$('#hidegreen').click(function() {
			if ($(this).is(':checked')) {
				$('li.green').hide();
			} else {
				$('li.green').show();
			}
		});
    });


    var Generate = function(list) {

        var $ul = $('#list');
        $ul.empty();

        $.each(list, function(title, details) {

            var bestFile = details.b;
            var bestFileGk = details.f[details.b].gk;
            var bestFileRank = details.f[details.b].rank;

            var styleClass = (bestFileRank >= 400) ? 'green' : (bestFileRank >= 250 ? 'yellow' : 'red');

            var $li = $('<li class="' + styleClass + '" data-title="' + title + '" />');

            //let go ahead and generate these 50 height images on the cdn
            var $img = $('<img src="' + paths.box + '/front/b/' + encodeURIComponent(bestFileGk) + '" />');
            $li.append($img);

            var $h3 = $('<h3>' + title + '</h3>');
            $li.append($h3);

            var $details = $('<div class="details" />');
            $details.append('<div> cdn rank: ' + bestFileRank + '</div>');

            var $videodrop = $('<div class="videodrop"></div>');
            $details.append($videodrop);

            $videodrop.dropzone({ 
				url: '/',
				sending: function(file, xhr, formData) {
					
					$('.dz-preview').hide();

					formData.append('folder', folder);
					formData.append('title', title);
					formData.append('system', system);
				},
				init: function () {
					this.on('error', function (file) {
						alert('There was an error saving the image. Please check the server!');
					});
					this.on('success', function() {
						
						$('.dz-preview').hide();
						
						loadImage(imagewrapper, size, system, title);

					});
				}
			});

            var $mediawrapper = $('<div class="mediawrapper" />');
            $details.append($mediawrapper);


            $li.append($details);

            $h3.on('click', function() {
                $li.toggleClass('open');

                if ($li.hasClass('open')) {


                    var $img = $('<img src="' + paths.box + '/front/' + encodeURIComponent(bestFileGk) + '?location=media" />');
                    $mediawrapper.empty().hide().append($img).imagesLoaded().done(function() {
                        
                        $mediawrapper.append('<div>Media Image Original Size: ' + $img[0].width + 'x' + $img[0].height + '</div>');
                        
                        $img.css('width', 300); //reduce for view

                        $mediawrapper.show();
                        $details.slideDown();
                    });


                    $details.slideDown();
                }
                else {
                    $details.slideUp();
                }

            });
            $ul.append($li);

        });
    };

})();
