define([
	'intern!object',
	'intern/chai!assert',
	'../../../../lib/reporters/pretty'
], function (registerSuite, assert, pretty) {
	function createReport(results, total, type) {
		var report = new pretty._Report(type);
		results && results.forEach(function (value) {
			report.record(value);
		});
		total && (report.total = total);
		return report;
	}

	registerSuite(function () {
		var mockCharm;

		return {
			name: 'intern/lib/reporters/pretty',

			'beforeEach': function () {
				mockCharm = {
					write: function (str) {
						mockCharm.out += str;
					},
					erase: function () {
					},
					position: function () {
					}
				};
				mockCharm.out = '';
				pretty.charm = mockCharm;
				pretty.total = createReport();
				pretty.reporters = {};
				pretty.sessions = [];
				pretty.log = [];
				pretty.dimensions = {
					width: 80,
					height: 24
				};
			},

			'_Report': function () {
				var report = createReport([0, 1, 2]);
				assert.deepEqual(report.type, '');
				assert.deepEqual(report.passed, 1);
				assert.deepEqual(report.skipped, 1);
				assert.deepEqual(report.failed, 1);
				assert.lengthOf(report.results, 3);
				assert.deepEqual([0, 1, 2], report.results);
				assert.deepEqual(report.getCompressedResults(1), [2]);
				assert.deepEqual(report.getCompressedResults(2), [1, 2]);
				assert.deepEqual(report.getCompressedResults(3), [0, 1, 2]);
				assert.deepEqual(report.getCompressedResults(4), [0, 1, 2]);
			},

			'_drawProgressBar': (function () {
				var report;

				return {
					beforeEach: function () {
						report = createReport([0, 1, 2, 1, 0]);
					},

					large: function () {
						report.total = 100;
						pretty._drawProgressBar(report, 20, mockCharm);
						assert.equal(mockCharm.out, '[×         ]   5/100');
					},

					small: function () {
						report.total = 10;
						pretty._drawProgressBar(report, 20, mockCharm);
						assert.equal(mockCharm.out, '[✓~×~✓     ]  5/10');
					}
				};
			})(),

			'_drawReporter': function () {
				var report = createReport([0, 1, 2], 10, {
					browserName: 'chrome',
					version: '32.0.12'
				});
				pretty._drawReporter(report, 80);
				assert.equal(mockCharm.out, 'Chr 32:   [✓~×       ]  3/10, 1 fail, 1 skip\n');
			},

			'_drawTotalReporter': function () {
				var report = createReport([0, 1, 2], 10);
				pretty._drawTotalReporter(report);
				assert.equal(mockCharm.out, 'Total: [✓~×       ]  3/10\nPassed: 1   Failed: 1   Skipped: 1\n');
			},
			
			'_render': {
				'empty': function () {
					pretty._render();
					assert.equal(mockCharm.out, 'Total: [] 0/0\nPassed: 0  Failed: 0  Skipped: 0\n\n');
				},

				'without logs': function () {
					var expected = 'Total: [✓✓✓✓~×✓✓✓                     ]  9/30\n' +
						'Passed: 7   Failed: 1   Skipped: 1\n' +
						'\n' +
						'Chr :     [✓✓~       ]  3/10, 1 skip\n' +
						'Fx  :     [✓✓✓       ]  3/10\n' +
						'IE  11:   [×✓✓       ]  3/10, 1 fail\n';
					pretty.total = createReport([0, 0, 0, 0, 1, 2, 0, 0, 0], 30);
					pretty.reporters = {
						'1': createReport([0, 0, 1], 10, { browserName: 'chrome' }),
						'2': createReport([0, 0, 0], 10, { browserName: 'firefox' }),
						'3': createReport([2, 0, 0], 10, { browserName: 'internet explorer', version: '11'})
					};
					pretty.sessions = ['1', '2', '3'];
					pretty._render();
					assert.equal(mockCharm.out, expected);
				},

				'with logs': function () {
					var expected = 'Total: [××××                          ]  4/30\n' +
						'Passed: 0   Failed: 4   Skipped: 0\n' +
						'\n' +
						'line 1\n' +
						'line 2\n' +
						'line 3\n' +
						'line 4';
					pretty.total = createReport([2, 2, 2, 2], 30);
					pretty.log = [
						'line 1',
						'line 2',
						'line 3',
						'line 4'
					];
					pretty._render();
					assert.equal(mockCharm.out, expected);
				}
			}
		};
	});
});
