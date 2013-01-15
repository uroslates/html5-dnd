define([
	'urldnd'
],
function(
	URLDnD
) {

	// Namespace
	window.url = {
		portals: []
	};

	// Register portals
	var registerPortals = function(portals) {
		var urlPortals = [];
		portals = portals.length ? portals : new Array(portals);
		
		[].forEach.call(portals, function(portal) {
			urlPortals.push( new URLDnD({ portal: portal }) );
		});

		return urlPortals;
	};

	// Bootstrap
	if (Modernizr.draganddrop) {
		url.portals = registerPortals( document.querySelectorAll('.url-portal') );
	}


	var p1 = url.portals[0];
	console.log('All portlets from 1st column are: ', p1.getColumnPortlets(p1.getColumns()[0]));

});