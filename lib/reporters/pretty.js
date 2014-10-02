define([
	'intern',
	'dojo/has',
	'./pretty/prettyRemote',
	'./pretty/prettyClient'
], function (intern, has, prettyRemote, prettyClient) {

	if(has('browser')) {
		throw new Error('reporter cannot be run in a browser');
	}

	if (intern.mode === 'client') {
		return prettyClient;
	} else {
		return prettyRemote;
	}
});