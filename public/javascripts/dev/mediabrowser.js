var cesdevMediaBrowser = (function() {

    var _self = this;
    
	$(document).ready(function() {

        Dropzone.autoDiscover = false;
        
        GenerateList(masterFile);

        $(window).on('keypress', function(e) {
            if (e.keyCode == 96)
            {
                e.preventDefault();
                $('#search').focus().val('');
            }
        });

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
        $li.addClass(styleClass);
        $li.data('title', title);

        //header
        var $head = $li.find('.head');
        console.log(paths.box + '/front/b/' + encodeURIComponent(bestFileGk));
        $head.find('img').attr('src', paths.box + '/front/b/' + encodeURIComponent(bestFileGk) + '?ts=' + Date.now()).imagesLoaded().done(function(img) {
            
        });
        $head.find('.rankflag').addClass(styleClass);
        $head.find('h2').text(title);

        //audit all media from the cdn
        $.get(paths.audit + '/' + encodeURIComponent(bestFileGk), function(response) {
            console.log(title, response);
            if (response.boxfront) {
                $head.find('.boxfront').css('visibility', 'visible');
            }
            if (response.titlescreen) {
                $head.find('.titlescreen').css('visibility', 'visible');
            }
            if (response.sqvideo) {
                $head.find('.sqvideo').css('visibility', 'visible');
            }
            if (response.contributionstitlescreen) {
                $head.find('.contributionstitlescreen').css('visibility', 'visible');
            }
            if (response.launchboxmetadata) {
                $head.find('.launchboxmetadata').css('visibility', 'visible');
            }

            //slider
            var $slider = $li.find('div.slider');

            //slider action
            $head.on('click', function() {
                $li.toggleClass('open');

                if ($li.hasClass('open')) {
                    
                    InfoSlider($li, $slider, title, details);
                    
                    BoxFrontPanel($li, $slider, title, details);
                    
                    TitlescreenPanel($li, $slider, title, details);

                    SqVideoPanel($li, $slider, title, details, response.sqvideo);

                    ContributionsTitlePanel($li, $slider, title, details);

                    LaunchBoxMetadataPanel($li, $slider, title, details);
                    
                    $slider.slideDown();
                }
                else {

                    $slider.find('video')[0].pause();

                    $slider.slideUp();
                }

            });
            if (opt_Open) {
                $head.click();
            }
        });
        
        return $li;
    };

    var RegenerateItem = function($li, title, details) {

        var li = $('#list').find($li);
        var newli = GenerateItem(title, details, true);
        newli.insertAfter(li);
        li.remove();
    };

    var InfoSlider = function($li, $slider, title, details) {

        var bestFile = details.b;
        var bestFileGk = details.f[details.b].gk;
        var bestFileRank = details.f[details.b].rank;

        //info
        var $info = $slider.find('li.info');
        $info.find('ul').empty();
        $info.find('ul').append('<li>Rank: ' + bestFileRank + '</li>');
        $info.find('ul').append('<li>Best File: ' + bestFile + '</li>');
        $info.find('textarea').empty().text(JSON.stringify(details));
    };

    var BoxFrontPanel = function($li, $slider, title, details) {
        
        var bestFile = details.b;
        var bestFileGk = details.f[details.b].gk;
        var bestFileRank = details.f[details.b].rank;

        //media box front
        var $boxfront = $slider.find('li.boxfront');
        var $boxfrontimg = $boxfront.find('.img'); 
        var $boxfrontDelete = $boxfront.find('.delete');
        $boxfrontDelete.hide();
        var imageUrl = paths.box + '/front/z/' + encodeURIComponent(bestFileGk);
        $boxfrontimg.removeClass('loaded').attr('src', imageUrl + '?ts=' + Date.now()).imagesLoaded().done(function(img) {

            $boxfrontDelete.show().off().on('click', function() {
                
                if (confirm('Are you sure to want to delete this artwork? It cannot be recovered.')) {
                
                    $.ajax({
                        url: '/media',
                        method: 'DELETE',
                        data: {
                            root: '/media',
                            filepath: '/box/front/' + system + '/' + title
                        }
                    }).done(function() {
                        RegenerateItem($li, title, details);
                    });
                }
            });

            $boxfront.find('p.dim').text('Image Size: ' + img.images[0].img.width + 'x' + img.images[0].img.height);

            $boxfrontimg.addClass('loaded');
        });
        
        $boxfront.find('input.googlesearch').off().on('click', function() {
            OpenGoogle(title + ' box', 2);
        });

        $boxfront.find('.view').off().on('click', function() {
            window.open(imageUrl, '_blank');
        });


        //removing the class disallows this to be selected on the next open (dz cannot be init twice)
        $boxfront.find('.dz').removeClass('dz').dropzone({
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
    };

    var TitlescreenPanel = function($li, $slider, title, details) {

        var bestFile = details.b;
        var bestFileGk = details.f[details.b].gk;
        var bestFileRank = details.f[details.b].rank;

        //titlescreen
        var $titlescreen = $slider.find('li.titlescreen');
        var $titlescreenimg = $titlescreen.find('.img'); 
        var $titlescreendelete = $titlescreen.find('.delete');
        $titlescreendelete.hide();

        $titlescreenimg.imagesLoaded().done(function(img) {

            $titlescreendelete.show().off().on('click', function() {
                
                if (confirm('Are you sure to want to delete this artwork? It cannot be recovered.')) {
                    
                    //this call will delete the file path in root and processed
                    $.ajax({
                        url: '/media',
                        method: 'DELETE',
                        data: {
                            root: '/media',
                            filepath: '/screen/title/' + system + '/' + title
                        }
                    }).done(function() {
                        RegenerateItem($li, title, details);
                    });
                }
            });

            $titlescreen.find('p.dim').text('Image Size: ' + img.images[0].img.width + 'x' + img.images[0].img.height);
        });

        $.ajax({
            url: paths.screen + '/title/z/' + encodeURIComponent(bestFileGk),
            type: 'GET',
            cache: false,
            complete: function(response) {

                //the response code gives us the best impression of success and image source on the CDN
                if (response.status == 200 || response.status == 201) {
                    $titlescreenimg.attr('src', 'data:image/jpg;base64,' + response.responseText);   
                }
            }
        });
        
        $titlescreen.find('input.googlesearch').off().on('click', function() {
            OpenGoogle(title + ' ' + system + ' title screen');
        });


        //removing the class disallows this to be selected on the next open (dz cannot be init twice)
        $titlescreen.find('.dz').removeClass('dz').dropzone({
            url: '/media',
            sending: function(file, xhr, formData) {
                
                $('.dz-preview').hide();

                formData.append('filepath', '/screen/title/' + system + '/' + title + '/' + bestFile);
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
    };

    var SqVideoPanel = function($li, $slider, title, details, info) {

        var bestFile = details.b;
        var bestFileGk = details.f[details.b].gk;
        var bestFileRank = details.f[details.b].rank;

        //sq video
        var $sqvideo = $slider.find('li.sqvideo');
        var $sqvideoDelete = $sqvideo.find('.delete');
        var $downloadLink = $sqvideo.find('.downloadlink');
        $sqvideoDelete.hide();
        $downloadLink.hide();
        var $video = $('<video />', {
            src: paths.video + '/sq/' + encodeURIComponent(bestFileGk),
            type: 'video/mp4',
            controls: true,
            autoplay: false
        });
        $downloadLink.attr('href', paths.video + '/sq/' + encodeURIComponent(bestFileGk)).attr('download', title + '.mp4');


        $video.on('loadeddata', function() {

            if (info) {
                $sqvideo.find('textarea.info').text(JSON.stringify(info));
                $sqvideo.find('textarea.notes').text(JSON.stringify(info.notes));
            }

            $downloadLink.show();
            $sqvideoDelete.show().off().on('click', function() {

                if (confirm('Are you sure to want to delete this artwork? It cannot be recovered.')) {
                    
                    //this call will delete the file path in root and processed
                    $.ajax({
                        url: '/media',
                        method: 'DELETE',
                        data: {
                            root: '/media',
                            filepath: '/video/sq/' + system + '/' + title
                        }
                    }).done(function() {
                        RegenerateItem($li, title, details);
                    });
                }
            });

        });
        var $sqvideoWrap = $sqvideo.find('.videowrapper').empty().append($video);

        //removing the class disallows this to be selected on the next open (dz cannot be init twice)
        $sqvideo.find('.dz').removeClass('dz').dropzone({
            url: '/media/video',
            sending: function(file, xhr, formData) {
                
                $('.dz-preview').hide();

                formData.append('notes', $sqvideo.find('textarea.notes').text());
                formData.append('filename', file.name);
                formData.append('filepath', '/video/sq/' + system + '/' + title);
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
    };

    var ContributionsTitlePanel = function($li, $slider, title, details) {

        var bestFile = details.b;
        var bestFileGk = details.f[details.b].gk;
        var bestFileRank = details.f[details.b].rank;

        //contributions title
        var $titlescreen = $slider.find('li.contributionstitle');
        var $titlescreenimg = $titlescreen.find('.img'); 
        var $titlescreendelete = $titlescreen.find('.delete');
        $titlescreendelete.hide();

        $titlescreenimg.imagesLoaded().done(function(img) {

            $titlescreendelete.show().off().on('click', function() {
                
                if (confirm('Are you sure to want to delete this artwork? It cannot be recovered.')) {
                    
                    //this call will delete the file path in root and processed
                    $.ajax({
                        url: '/media',
                        method: 'DELETE',
                        data: {
                            root: '/contributions',
                            filepath: '/screen/title/' + system + '/' + title
                        }
                    }).done(function() {
                        RegenerateItem($li, title, details);
                    });
                }
            });

            $titlescreen.find('p.dim').text('Image Size: ' + img.images[0].img.width + 'x' + img.images[0].img.height);
        });

        $.ajax({
            url: paths.screen + '/title/y/' + encodeURIComponent(bestFileGk),
            type: 'GET',
            cache: false,
            complete: function(response) {

                //the response code gives us the best impression of success and image source on the CDN
                if (response.status == 200 || response.status == 201) {
                    $titlescreenimg.attr('src', 'data:image/jpg;base64,' + response.responseText);   
                }
            }
        });
    };

    var LaunchBoxMetadataPanel = function($li, $slider, title, details, info) {

        var bestFile = details.b;
        var bestFileGk = details.f[details.b].gk;
        var bestFileRank = details.f[details.b].rank;

        var $metadata = $slider.find('li.metadata');
        var $metadataSave = $metadata.find('.save');
        $metadataSave.hide();

        var editor = new JSONEditor($slider.find('div.jsoneditor').get(0), {
            mode: 'tree'
        });

        $metadataSave.show().off().on('click', function() {

            //POST update
            $.ajax({
                url: '/media/metadata',
                method: 'POST',
                data: {
                    data: JSON.stringify(editor.get()),
                    filepath: '/metadata/launchbox/' + system + '/' + title
                }
            }).done(function() {
                RegenerateItem($li, title, details);
            });
        });

        $.ajax({
            url: paths.metadata + '/lb/' + encodeURIComponent(bestFileGk),
            type: 'GET',
            cache: false,
            complete: function(response) {

                //the response code gives us the best impression of success and image source on the CDN
                if (response.status == 200 || response.status == 201) {
                    editor.set(JSON.parse(response.responseText));
                }
            }
        });

        //removing the class disallows this to be selected on the next open (dz cannot be init twice)
        $metadata.find('.dz').removeClass('dz').dropzone({
            url: '/media/metadata/file',
            sending: function(file, xhr, formData) {
                
                $('.dz-preview').hide();
                formData.append('filepath', '/metadata/launchbox/' + system + '/' + title);
                formData.append('title', title);
                formData.append('system', system);
            },
            init: function () {
                this.on('error', function (file) {
                    alert('There was an error saving the metadata. Please check the server!');
                    RegenerateItem($li, title, details);
                });
                this.on('success', function() {
                    
                    $('.dz-preview').hide();
                    RegenerateItem($li, title, details);
                });
            }
        });
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
            case 2:
                size = "qsvga"
                break;
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
