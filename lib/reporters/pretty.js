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
		this.ttySupport = process.stdout.isTTY;
		this.charm = null;
		this._renderers = {};
		this._rendererList = [];
		this._coverage = new Collector();
		this._cursorPos = 0;
		this._lastRenderTime = 0;
		this._minRenderIntervalMs = 50;
		this._problemTests = [];

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
			if (this.ttySupport) {
				this.charm.reset();
			}
		},

		stop: function () {
			// clear the screen for TTYs
			if (this.ttySupport) {
				this.charm.reset();
			} else {
				// Add a line for readability
				this.charm.write('\n');
			}

			// Display coverage information
			(new Reporter()).writeReport(this._coverage, true);

			// Display verbose information about test failures and skips
			this._displayTestIssues({ tests: this._problemTests }, true);

			if (this.ttySupport) {
				this._render(true);
			}
		},

		destroy: function () {
			this.charm.destroy();
		},

		'/suite/new': function () {
			// NOTE this is where we could grab a list of all requested environments
		},

		'/suite/start': function (suite) {
			if (isRootSuite(suite)) {
				var sessionId = suite.sessionId || '';
				var renderers = this._renderers[sessionId];

				if (renderers) {
					renderers[0].numTests = suite.numTests;
					return;
				}
				if (sessionId) {
					var env = suite.remote && suite.remote.environmentType;
					renderers = this._renderers[sessionId] = [
						new RemoteRenderer(this.charm, 'UNIT'),
						new RemoteRenderer(this.charm, 'FUNC', env, suite.numTests)
					];
					this._rendererList.push(renderers[1], renderers[0]);
				} else {
					renderers = this._renderers[sessionId] = [
						new ClientRenderer(this.charm, suite.numTests)
					];
					this._rendererList.push(renderers[0]);
				}

				renderers.forEach(function(renderer) {
					// Tag this renderer with the sessionId for easier identification during rendering
				    renderer.sessionId = sessionId;
				});
			}
		},

		'/suite/end': function (suite) {
			if (isRootSuite(suite)) {
				// Shift out the current suite making the next one active
				var sessionId = suite.sessionId || '';
				var renderers = this._renderers[sessionId];
				renderers.shift();

				// Render displays
				this._render();
			}
		},

		'/test/pass': function (test) {
			var sessionId = test.sessionId || '';
			var renderer = this._renderers[sessionId][0];

			renderer.recordPassed();
			this.ttySupport && this._throttledRender();
		},

		'/test/skip': function (test) {
			var sessionId = test.sessionId || '';
			var renderer = this._renderers[sessionId][0];

			renderer.recordSkipped();
			this._problemTests.push(test);
			this.ttySupport && this._throttledRender();
		},

		'/test/fail': function (test) {
			var sessionId = test.sessionId || '';
			var renderer = this._renderers[sessionId][0];

			renderer.recordFailed();
			this._problemTests.push(test);
			this.ttySupport && this._throttledRender();
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

		'_throttledRender': function () {
			if (Date.now() - this._lastRenderTime < this._minRenderIntervalMs) {
				return;
			}

			this._render();
			this._lastRenderTime = Date.now();
		},

		/**
		 * Draw the renderers to the screen
		 */
		'_render': function (force) {
			var i = 0;
			var pos = 0;
			var renderer;

			if (!force) {
				// Move through the list to where rendering starts
				while (i < this._rendererList.length && !(renderer = this._rendererList[i]).needsRender) {
					pos += renderer.height;
					i++;
				}

				if (this.ttySupport && this._cursorPos - pos > 0) {
					this.charm.up(this._cursorPos - pos);
				}
			}

			for (;i < this._rendererList.length; i++) {
				renderer = this._rendererList[i];
				var renderingComplete = this._renderers[renderer.sessionId].length === 0;
				if ((force || renderer.needsRender) && (this.ttySupport || renderingComplete)) {
					renderer.render();
				}
				else {
					this.charm.down();
				}
				pos += renderer.height;
			}

			this._cursorPos = pos;
		},

		/**
		 * Displays detailed test result information at the end of a test run
		 * @param test a Test or Suite
		 * @private
		 */
		_displayTestIssues: function (test) {
			if (test.tests) {
				test.tests.forEach(this._displayTestIssues);
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