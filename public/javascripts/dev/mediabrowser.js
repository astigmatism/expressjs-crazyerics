var cesdevMediaBrowser = (function() {

    var _self = this;
    
	$(document).ready(function() {

        
        GenerateList(masterFile);

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

                GenerateList(set);
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


    var GenerateList = function(list) {

        var $ul = $('#list');
        $ul.empty();

        $.each(list, function(title, details) {
            var $li = GenerateItem(title, details);
            $ul.append($li);
        });
    };

    var GenerateItem = function(title, details, opt_Open) {

        var bestFile = details.b;
        var bestFileGk = details.f[details.b].gk;
        var bestFileRank = details.f[details.b].rank;

        var $li = $('#template li.item').clone();

        var styleClass = (bestFileRank >= 400) ? 'green' : (bestFileRank >= 250 ? 'yellow' : 'red');
        $li.addClass(styleClass)
        $li.data('title', title);

        //header
        var $head = $li.find('.head');
        console.log(paths.box + '/front/b/' + encodeURIComponent(bestFileGk));
        $head.find('img').attr('src', paths.box + '/front/b/' + encodeURIComponent(bestFileGk)).imagesLoaded().done(function(img) {
            
        });
        $head.find('.rankflag').addClass(styleClass);
        $head.find('h2').text(title);

        //details block
        var $slider = $li.find('div.slider');

        //info
        var $info = $slider.find('li.info');
        $info.find('ul').append('<li>Rank: ' + bestFileRank + '</li>');
        $info.find('ul').append('<li>Best File: ' + bestFile + '</li>');
        $info.find('textarea').text(JSON.stringify(details));

        //media box front
        var $boxfront = $slider.find('li.boxfront');
        var $boxfrontimg = $boxfront.find('img'); 
        var $boxfrontDelete = $boxfront.find('.boxfrontdelete');
        $boxfrontDelete.hide();
        $boxfrontimg.hide().attr('src', paths.box + '/front/' + encodeURIComponent(bestFileGk) + '?location=media').imagesLoaded().done(function(img) {

            $boxfrontimg.show();
            $boxfrontDelete.show();

            $boxfront.find('p.dim').text('Image Size: ' + img.images[0].img.width + 'x' + img.images[0].img.height);

            $head.find('.boxfront').text('box front');

            $(img.images[0].img).css('width', '100%');
        });
        $boxfront.find('input.googlesearch').show().on('click', function() {
            OpenGoogle(title + ' box');
        });
        $boxfront.find('.dropzone').dropzone({ 
            url: '/media',
            sending: function(file, xhr, formData) {
                
                $('.dz-preview').hide();

                formData.append('filepath', '/box/front/' + system + '/' + title);
                formData.append('title', title);
                formData.append('system', system);
            },
            init: function () {
                this.on('error', function (file) {
                    alert('There was an error saving the image. Please check the server!');
                    RegenerateItem($li, title, details);
                });
                this.on('success', function() {
                    
                    $('.dz-preview').hide();
                    
                    RegenerateItem($li, title, details);

                });
            }
        });

        $head.on('click', function() {
            $li.toggleClass('open');

            if ($li.hasClass('open')) {


                // var $img = $('<img src="' + paths.box + '/front/' + encodeURIComponent(bestFileGk) + '?location=media" />');
                // $mediawrapper.empty().hide().append($img).imagesLoaded().done(function() {
                    
                //     $mediawrapper.append('<div>Media Image Original Size: ' + $img[0].width + 'x' + $img[0].height + '</div>');
                    
                //     $img.css('width', 300); //reduce for view

                //     $mediawrapper.show();
                //     $details.slideDown();
                // });


                $slider.slideDown();
            }
            else {
                $slider.slideUp();
            }

        });
        if (opt_Open) {
            $head.click();
        }
        return $li;
    }

    var RegenerateItem = function($li, title, details) {

        var li = $('#list').find($li);
        var newli = GenerateItem(title, details, true);
        newli.insertAfter(li);
        li.remove();
    };

    var OpenGoogle = function(term, size, type) {

        var height = $('#height').val();
        var width = $('#width').val();
    
        switch (type) {
            case 2:
                term += ' ' + $('#search1').val();
                break;
            case 3:
                term += ' ' + $('#search2').val();
                break;
            case 4:
                term += ' box';
                break;
            case 5:
                term += ' ' + $('#search1').val() + ' box';
                break;
            case 6:
                term += ' ' + $('#search2').val() + ' box';
                break;
        }
        term = escape(term);
    
        switch (size)
        {
            case 1:
                size = "vga";
                break;
            default:
                size = "qsvga"
        }
        
    
        var url;
    
        if (height && width) {
            url = 'https://www.google.com/search?q=' + term + '&source=lnms&tbm=isch&sa=X&ved=0ahUKEwi89tOMoezKAhVT22MKHWQDBxYQ_AUIBygB&biw=2156&bih=1322&tbm=isch&tbs=isz:ex,iszw:' + width + ',iszh:' + height;
        }
        else {
            url = 'https://www.google.com/search?q=' + term + '&source=lnms&tbm=isch&sa=X&ved=0ahUKEwi89tOMoezKAhVT22MKHWQDBxYQ_AUIBygB&biw=2156&bih=1322&tbm=isch&tbs=isz:lt,islt:' + size;
        }
        
        window.open(url, '_blank');
    };

})();
