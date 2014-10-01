define([
	'intern',
	'dojo/has',
	'./pretty/RemoteView',
	'./pretty/ClientView',
	'dojo/node!util'
], function (intern, has, RemoteView, ClientView, util) {
	var pretty, view;

	if(has('browser')) {
		throw new Error('reporter cannot be run in a browser');
	}

	return (pretty = {
		start: function () {
			console.log('Running in ' + intern.mode + ' mode');
			view = (intern.mode === 'client' ? new ClientView() : new RemoteView());
			view.start();
		},

		// after the runner has finished its configuration process and has started the Sauce Connect server
		'/runner/start': noop,

		'/suite/new': function (suite) {
			view.suiteCreated(suite);
		},

		// when a suite is about to start executing.
		'/suite/start': function (suite) {
			view.suiteStarted(suite);
		},

		'/suite/end': function (suite) {
			view.suiteEnded(suite);
		},

		// after a test environment has been successfully initialised but before it has been instructed to run any tests
		'/session/start': function (remote) {
			console.log('Initialised ' + remote.environmentType);
		},

		'/test/pass': function (test) {
			view.testPassed(test);
		},
		'/test/skip': function (test) {
			view.testSkipped(test);
		},
		'/test/fail': function (test) {
			view.testFailed(test);
		},

		// when code coverage data has been retrieved from an environment under test
		'/runner/end': function () {
			console.log('end');
		},

		// published once for each deprecated method that is called on the WebDriver client
		'/deprecated': noop
	});

	// TODO remove me
	function noop() { }
})