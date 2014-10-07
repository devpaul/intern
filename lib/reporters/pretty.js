/**
 * Handles presentation of runner results to the user
 */
define([
	'dojo/node!charm',
	'./pretty/RemoteRenderer',
	'./pretty/ClientRenderer',
	'../util',
	'dojo/node!util',
	'dojo/has!host-node?dojo/node!istanbul/lib/collector',
	'dojo/has!host-node?dojo/node!istanbul/lib/report/text'
], function (charm, RemoteRenderer, ClientRenderer, internUtil, nodeUtil, Collector, Reporter) {
	/* globals process */

	function isRootSuite(suite) {
		return suite.name && suite.name === 'main' && !suite.parent;
	}

	function PrettyReporter() {
		this.charm = null;
		this._renderers = {};
		this._rendererList = [];
		this._coverage = new Collector();

		// Since reporters are currently treated as singletons we need to bind our context
		for (var key in PrettyReporter.prototype) {
			var value = PrettyReporter.prototype[key];
			if (typeof value === 'function') {
				this[key] = value.bind(this);
			}
		}
	}

	PrettyReporter.prototype =  {
		constructor: PrettyReporter,

		start: function () {
			this.charm = charm();
			this.charm.pipe(process.stdout);
		},

		destroy: function () {
			this.charm.destroy();
		},

		'/suite/new': function () {
			// NOTE this is where we could grab a list of all requested environments
		},

		'/session/start': function (remote) {
			console.log('session started: ' + remote.sessionId + ' ' + remote.environmentType);
		},

		'/suite/start': function (suite) {
			if (isRootSuite(suite)) {
				var sessionId = suite.sessionId || '';
				var renderers = this._renderers[sessionId];

				if (renderers) {
					// Renderers already exist for this sessionId
					renderers.unshift();
					renderers[0].numTests = suite.numTests;
				}
				if (sessionId) {
					var env = suite.remote && suite.remote.environmentType;
					renderers = this._renderers[sessionId] = [
						new RemoteRenderer(this.charm, 'FUNC', env && env.browserName, suite.numTests),
						new RemoteRenderer(this.charm, 'UNIT')
					];
					this._rendererList.push(renderers[0], renderers[1]);
				} else {
					renderers = this._renderers[sessionId] = [
						new ClientRenderer(this.charm, suite.numTests)
					];
					this._rendererList.push(renderers[0]);
				}
			}
		},

		'/suite/end': function (suite) {
			if (isRootSuite(suite)) {
				var sessionId = suite.sessionId || '';
				console.log('suite ended: ' + sessionId);
				this._render();
				this._displayDetailedTestResults(suite);
			}
		},

		'/test/pass': function (test) {
			var sessionId = test.sessionId || '';
			var renderer = this._renderers[sessionId][0];

			if (!renderer) { console.log('missing: ' + sessionId); }
			renderer.recordPassed();
		},

		'/test/skip': function (test) {
			var sessionId = test.sessionId || '';
			var renderer = this._renderers[sessionId][0];
			renderer.recordSkipped();
		},

		'/test/fail': function (test) {
			var sessionId = test.sessionId || '';
			var renderer = this._renderers[sessionId][0];
			renderer.recordFailed();
		},

		'/tunnel/start': function () {
			console.log('Starting tunnel...');
		},

		'/tunnel/status': function (tunnel, status) {
			console.log(status);
		},

		'/coverage': function (sessionId, coverage) {
			this._coverage.add(coverage);
		},

		'/deprecated': function (name, replacement, extra) {
			console.warn(name + ' is deprecated.' +
				(replacement ?
					' Use ' + replacement + ' instead.' :
					' Please open a ticket at https://github.com/theintern/intern/issues if you still require access ' +
					'to this command through the Command object.') +
				(extra ? ' ' + extra : '')
			);
		},

		'/error': function (error) {
			internUtil.logError(error);
		},

		'/client/end': function () {
			console.log('client end');
		},

		'/runner/end': function () {
			// add a newline between test results and coverage results for prettier output
			this.charm.write('\n');

			(new Reporter()).writeReport(this._coverage, true);
		},

		/**
		 * Draw the renderers to the screen
		 */
		'_render': function () {
			this._rendererList.forEach(function (renderer) {
				renderer.render();
			});
		},

		/**
		 * Displays detailed test result information at the end of a test run
		 * @param test a Test or Suite
		 * @private
		 */
		_displayDetailedTestResults: function (test) {
			if (test.tests) {
				test.tests.forEach(this._displayDetailedTestResults);
			} else if (test.skipped) {
				console.log('SKIP: ' + test.id + ' (' + test.timeElapsed + 'ms)');
			} else if (test.error) {
				this.charm.foreground('red')
					.write('\nFAIL')
					.display('reset')
					.write(': ' + test.id + ' (' + test.timeElapsed + 'ms)\n');
				internUtil.logError(test.error);
			}
		}
	};

	return new PrettyReporter();
});