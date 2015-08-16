var crazyerics = function() {
	
	var self = this;
	
	$(document).ready(function() {
		self.googleimagesearch('nes blaster master box', $('#gametitlewrapper img'));
	});
};

crazyerics.prototype.googleimagesearch = function(searchterm, images) {

	$.ajax({
		url: 'https://ajax.googleapis.com/ajax/services/search/images',
		dataType: "jsonp",
		data: {
			v: "1.0",
			rsz: 8,
			start: 0,
			q: searchterm
		},
		success: function(response) {
			if (response && response.responseData && response.responseData.results) {
				for (var i = 0; i < images.length; ++i) {
					if (response.responseData.results[i] && response.responseData.results[i].tbUrl) {
						$(images[i]).attr('src', response.responseData.results[i].tbUrl);
					}
				}
			}
		}
	});
};

var crazyerics = new crazyerics();