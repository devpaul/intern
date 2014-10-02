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
	var reporter;

	function isRootSuite(suite) {
		return suite.name && suite.name === 'main' && !suite.parent;
	}

	// tests/selftest.intern
	// Total: [✔︎~✔︎✔︎×✔︎/             ]  32/100
	// Passed: 30   Failed: 1    Skipped: 1
	return (reporter = {
		charm: null,
		results: null,
		coverage: null,

		start: function () {
			reporter.charm = charm();
			reporter.charm.pipe(process.stdout);
		},

		'/suite/start': function (suite) {
			if (isRootSuite(suite)) {
				reporter.results = new Results(suite.numTests, 10);
				reporter._displayClientResults();
				reporter._startRefresh(100);
			}
		},

		'/suite/end': function (suite) {
			if (isRootSuite(suite)) {
				clearInterval(reporter.refreshHandle);
				reporter._updateClientResults(reporter.results);
				console.log('');
				reporter._displayDetailedTestResults(suite);
			}
		},

		'/test/pass': function () {
			reporter.results.recordPassed();
		},
		'/test/skip': function () {
			reporter.results.recordSkipped();
		},
		'/test/fail': function () {
			reporter.results.recordFailed();
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
			clearInterval(reporter.refreshHandle);
			reporter.refreshHandle = setInterval(function () {
				reporter.charm.display('reset');
				reporter._updateClientResults();
			}, msBetweenUpdate);
		},

		/**
		 * Update the cursor position and redraw the client results
		 * @private
		 */
		_updateClientResults: function () {
			reporter.charm.up(2).display('reset');
			reporter._displayClientResults(reporter.results);
		},

		/**
		 * Draw the complete client results to the screen
		 * @private
		 */
		_displayClientResults: function () {
			var results = reporter.results;

			if (!reporter.progressBar) {
				reporter.progressBar = new ProgressBar(reporter.charm, results);
			}

			reporter.charm.write('Total: [');
			reporter.progressBar.render();
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
				test.tests.forEach(reporter._displayDetailedTestResults);
			} else if (test.skipped) {
				console.log('SKIP: ' + test.id + ' (' + test.timeElapsed + 'ms)');
			} else if (test.error) {
				reporter.charm.foreground('red')
					.write('FAIL')
					.display('reset')
					.write(': ' + test.id + ' (' + test.timeElapsed + 'ms)\n');
				util.logError(test.error);
			}
		}
	});
});