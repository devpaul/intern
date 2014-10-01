/**
 * Handles presentation of runner results to the user
 */
define([
	'dojo/node!charm',
	'./StatusBar',
	'dojo/node!util'
], function (charm, ProgressBar, nodeUtil) {
	/* globals process */

	var PAD = '                                                    ';

	function isRootSuite(suite) {
		return suite.name && suite.name === 'main' && !suite.parent;
	}

	function isFunctionalSuite(suite) {
		return !!suite._remote;
	}

	function getShortenedName(env) {

	}

	function suiteInfo(suite, action) {
		var env = suite.remote && suite.remote._desiredEnvironment;

		if (isFunctionalSuite(suite)) {
			console.log('%s functional suite %s for %s %s on %s with %d tests',
				suite.sessionId, action, env.browserName, env.version, env.platform, suite.numTests);
		} else {
			console.log('%s unit test suite %s with %d tests', suite.sessionId, action, suite.numTests);
		}
	}

//	Total: [✔︎~✔︎✔︎×✔︎/             ]  32/100
//	Passed: 30   Failed: 1    Skipped: 1
//
//	IE 9:       Unit [✔︎~✔︎×✔︎✔︎✔︎✔︎✔︎✔︎] 100/100, 2 fail, 1 skip
//	Cov 100/89% Func [✔︎~✔︎×✔︎✔︎✔︎✔︎✔︎✔︎] 100/100, 2 fail, 1 skip
//	IE 10:      Unit [✔︎~✔︎×✔︎✔︎/   ]  65/100, 2 fail, 1 skip
//	Func [          ]   0/100
//	Fx 24.0.1:  Unit [/         ]   2/100
//	Func [          ]   0/100
//	Chr 32:     Starting
//
//	Saf 7:      Pending
//
//	Android 19: Pending
	function RemoteView() {
		this._functionalSessions = {};
		this._unitSessions = {};

		// create the root session
		this.createSession();
	}

	RemoteView.prototype = {
		start: function () {
			this.charm = charm();
			this.charm.pipe(process.stdout);
		},

		suiteCreated: function (suite) {
			suiteInfo(suite, 'created');
		},
		suiteStarted: function (suite) {
			if (isRootSuite(suite)) {
				// TODO
				suiteInfo(suite, 'started');
			}
		},
		suiteEnded: function (suite) {
			if (isRootSuite(suite)) {
				suiteInfo(suite, 'ended');
			}
		},

		testPassed: function () {
		},
		testSkipped: function () {
		},
		testFailed: function () {
		},

		_displayClientResults: function (results) {
			var progressBar = new ProgressBar(this.charm, results);

			this.charm.write('Total: [');
			progressBar.render();
			console.log('] %d/%d', results.complete, results.total);
			console.log('Passed: %d  Failed: %d  Skipped: %d', results.passed, results.failed, results.skipped);
		},

		_displayFunctionalResults: function (unitResults, funcResults, browserName) {
			var title = nodeUtil.format('%s: ');
			var spacer = PAD.slice(0, title.length);
			this._displaySingleLineFunctional(unitResults, title);
			this._displaySingleLineFunctional(funcResults, spacer);
		},
		
		_displaySingleLineFunctional: function (results, title) {
			var progressBar = new ProgressBar(this.charm, results);

			this.charm.write(nodeUtil.format('%s [', title));
			progressBar.render();
			this.charm.write(nodeUtil.format('] %d/%d', results.complete, results.progress));
			if(results.fail) {
				this.charm.write(nodeUtil.format(', %d fail', results.failed));
			}
			if(results.skip) {
				this.charm.write(nodeUtil.format(', %d skip', results.skipped));
			}
			this.charm.write('\n');
		},

		createSession: function () {
		},

		getSession: function () {
		}
	};

	return RemoteView;
});