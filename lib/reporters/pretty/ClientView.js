define([
	'dojo/node!charm',
	'./StatusBar',
	'./Results'
], function (charm, ProgressBar, Results) {
	function isRootSuite(suite) {
		return suite.name && suite.name === 'main' && !suite.parent;
	}

	/* globals process */
	// tests/selftest.intern
	// Total: [✔︎~✔︎✔︎×✔︎/             ]  32/100
	// Passed: 30   Failed: 1    Skipped: 1
	function PTYClientView() {
		this.results = null;
	}

	PTYClientView.prototype = {
		start: function () {
			this.charm = charm();
			this.charm.pipe(process.stdout);
		},

		suiteCreated: function () { },
		suiteStarted: function (suite) {
			if (isRootSuite(suite)) {
				this.results = new Results(suite.numTests, 10);
				this._displayClientResults();
				this._startRefresh(100);
			}
		},
		suiteEnded: function (suite) {
			// TODO output fails and skips
			if (isRootSuite(suite)) {
				this._updateClientResults(this.results);
				clearInterval(this.refreshHandle);
			}
		},

		testPassed: function () {
			this.results.recordPassed();
		},
		testSkipped: function () {
			this.results.recordSkipped();
		},
		testFailed: function () {
			this.results.recordFailed();
		},

		_startRefresh: function (msBetweenUpdate) {
			clearInterval(this.refreshHandle);
			this.refreshHandle = setInterval(function () {
				this.charm.display('reset');
				this._updateClientResults();
			}.bind(this), msBetweenUpdate);
		},

		_updateClientResults: function () {
			this.charm.up(2).display('reset');
			this._displayClientResults(this.results);
		},

		_displayClientResults: function () {
			var results = this.results;

			if (!this.progressBar) {
				this.progressBar = new ProgressBar(this.charm, results);
			}

			this.charm.write('Total: [');
			this.progressBar.render();
			console.log('] %d/%d', results.complete, results.total);
			console.log('Passed: %d  Failed: %d  Skipped: %d', results.passed, results.failed, results.skipped);
		}
	};

	return PTYClientView;
});