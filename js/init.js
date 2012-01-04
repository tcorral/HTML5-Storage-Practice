$(function () {
	if (!supports_html5_storage) {
		$('#content').html('Please choose a browser that supportes HTML5 LocalStorage!');
		return false;
	}



	setupTODOS();
});