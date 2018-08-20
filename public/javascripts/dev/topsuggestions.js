// var TopSuggestions = (function() {

//     var _self = this;
	
// 	$(document).ready(function() {

//         $ul = $('#grid');

// 		$.each(boxFronts, function(title, details) {

//             var $li = $('<li class="grid-item" data-title="' + title + '" />');

//             if (currentTs[title]) {
//                 $li.addClass('selected');
//             }

//             $li.append('<div>' + title + '</div>');
//             var $img = $('<img src="' + cdn + '/' + encodeURIComponent(details.gk) + '" />');            
//             $li.append($img);
//             $li.append('<div>' + details.score + '</div>');
//             $li.append('<div> cdn rank: ' + details.rank + '</div>');

//             $img.imagesLoaded().done(function(imgLoad, image) {
//                 //_grid.isotope('layout');
//             });

//             $li.on('click', function() {
//                 $li.toggleClass('selected');

//                 $.ajax({
//                     url: '/dev/ts/' + system,
//                     type: $li.hasClass('selected') ? 'PUT' : 'DELETE',
//                     data: {
//                         t: title
//                     }
//                 });

//             });
//             $ul.append($li);

//         });
//     });

// })();
