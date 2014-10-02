/**
 * Handles presentation of client results to the user
 */
define([
	'../../util',
	'dojo/node!charm',
	'./StatusBar',
	'./Results',
	'dojo/has!host-node?dojo/node!istanbul/lib/collector',
	'dojo/has!host-node?dojo/node!istanbul/lib/report/text'
], function (util, charm, ProgressBar, Results, Collector, Reporter) {
	/* globals process */
	function isRootSuite(suite) {
		return suite.name && suite.name === 'main' && !suite.parent;
	}

	function PrettyClient() {
		this.charm = null;
		this.results = null;
		this.coverage = null;

		// Since reporters are currently treated as singletons we need to bind our context
		for (var key in PrettyClient.prototype) {
			var value = PrettyClient.prototype[key];
			if (typeof value === 'function') {
				this[key] = value.bind(this);
			}
		}
	}
	
	PrettyClient.prototype =  {
		constructor: PrettyClient,

		start: function () {
			this.charm = charm();
			this.charm.pipe(process.stdout);
		},

		destroy: function () {
			this.charm.destroy();
		},

		'/suite/start': function (suite) {
			if (isRootSuite(suite)) {
				this.results = new Results(suite.numTests, 10);
				this._displayClientResults();
				this._startRefresh(100);
			}
		},

		'/suite/end': function (suite) {
			if (isRootSuite(suite)) {
				clearInterval(this.refreshHandle);
				this._updateClientResults(this.results);
				console.log('');
				this._displayDetailedTestResults(suite);
			}
		},

		'/test/pass': function () {
			this.results.recordPassed();
		},
		'/test/skip': function () {
			this.results.recordSkipped();
		},
		'/test/fail': function () {
			this.results.recordFailed();
		},

		'/coverage': function (sessionId, coverage) {
			var collector = new Collector();
			collector.add(coverage);

			// add a newline between test results and coverage results for prettier output
			console.log('');

			(new Reporter()).writeReport(collector, true);
		},

		/**
		 * Update the client results on a set interval
		 * @param msBetweenUpdate the number of ms between updates
		 * @private
		 */
		_startRefresh: function (msBetweenUpdate) {
			clearInterval(this.refreshHandle);
			this.refreshHandle = setInterval(function () {
				this.charm.display('reset');
				this._updateClientResults();
			}.bind(this), msBetweenUpdate);
		},

		/**
		 * Update the cursor position and redraw the client results
		 * @private
		 */
		_updateClientResults: function () {
			this.charm.up(2).display('reset');
			this._displayClientResults(this.results);
		},

		/**
		 * Draw the complete client results to the screen
		 * @private
		 */
		_displayClientResults: function () {
			var results = this.results;

			if (!this.progressBar) {
				this.progressBar = new ProgressBar(this.charm, results);
			}

			this.charm.write('Total: [');
			this.progressBar.render();
			console.log('] %d/%d', results.complete, results.total);
			console.log('Passed: %d  Failed: %d  Skipped: %d', results.passed, results.failed, results.skipped);
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
					.write('FAIL')
					.display('reset')
					.write(': ' + test.id + ' (' + test.timeElapsed + 'ms)\n');
				util.logError(test.error);
			}
		}
	};

	return new PrettyClient();
});