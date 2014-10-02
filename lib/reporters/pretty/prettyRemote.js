/**
 * Handles presentation of runner results to the user
 */
define([
	'dojo/node!charm',
	'./Results',
	'./StatusBar',
	'dojo/node!util'
], function (charm, Results, ProgressBar, nodeUtil) {
	/* globals process */

	var PAD = '                                                    ';

	function isRootSuite(suite) {
		return suite.name && suite.name === 'main' && !suite.parent;
	}

	function isFunctionalSuite(suite) {
		return !!suite._remote;
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
//	            Func [          ]   0/100
//	Fx 24.0.1:  Unit [/         ]   2/100
//	            Func [          ]   0/100
//	Chr 32:     Starting
//
//	Saf 7:      Pending
//
//	Android 19: Pending
	function RemoteView() {
		this._sessions = {};
		this._displayOrder = [];
	}

	RemoteView.prototype = {
		start: function () {
			this.charm = charm();
			this.charm.pipe(process.stdout);
			this.titleChars = 12;
			this.lineOffset = 0;
		},

		suiteCreated: function (suite) {
//			suiteInfo(suite, 'created');
		},
		suiteStarted: function (suite) {
			if (isRootSuite(suite)) {
				var sessionId = suite.sessionId;
				var session = this._sessions[sessionId] || (this._sessions[sessionId] = {
					name: this._getName(suite),
					lineOffset: null
				});
				var results = new Results(suite.numTests, 10);
				var info = {
					suite: suite,
					results: results,
					progressBar: new ProgressBar(this.charm, results)
				};
				if (!session.functional) {
					// By convention functional tests come first
					session.functional = info;
					this._displayOrder.push(sessionId);
				} else {
					// By convention unit tests come second
					session.unit = info;
				}

				this._startDisplay();
			}
		},
		suiteEnded: function (suite) {
			if (isRootSuite(suite)) {
				suiteInfo(suite, 'ended');
			}
		},

		testPassed: function (test) {
			var session = this._sessions[test.sessionId];
			var current = session.functional.results.isComplete() ? session.unit : session.functional;
			current.results.recordPassed();
		},
		testSkipped: function (test) {
			var session = this._sessions[test.sessionId];
			var current = session.functional.results.isComplete() ? session.unit : session.functional;
			current.results.recordSkipped();
		},
		testFailed: function (test) {
			var session = this._sessions[test.sessionId];
			var current = session.functional.results.isComplete() ? session.unit : session.functional;
			current.results.recordFailed();
		},

		_getName: function (suite) {
			// TODO get a shortened name
			return 'todo';
		},

		_startDisplay: function () {
			return; // TODO remove this
			this._displayResults();
			clearInterval(this.refreshHandle);
			this.refreshHandle = setInterval(function () {
				this.charm.display('reset');
				this._updateClientResults();
			}.bind(this), 100);
		},

		_displayResults: function () {
			this._displayOrder.forEach(function(sessionId) {
			    var session = this._sessions[sessionId];
				this._displaySingleLineFunctional(session.name, session.functional);
				this._displaySingleLineFunctional(session.name, session.unit);
			}.bind(this));
		},

		_displaySingleLineFunctional: function (title, info) {
			this.charm.write(nodeUtil.format('%s [', title));
			info.progressBar.render();
			this.charm.write(nodeUtil.format('] %d/%d', info.results.complete, info.results.total));
			if(info.results.fail) {
				this.charm.write(nodeUtil.format(', %d fail', info.results.failed));
			}
			if(info.results.skip) {
				this.charm.write(nodeUtil.format(', %d skip', info.results.skipped));
			}
			this.charm.write('\n');
		}
	};

	return RemoteView;
});