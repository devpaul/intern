define([
	'intern!object',
	'intern/chai!assert',
	'../../../../lib/reporters/pretty'
], function (registerSuite, assert, pretty) {
	registerSuite(function () {
		var mockCharm;

		return {
			name: 'intern/lib/reporters/pretty',

			'beforeEach': function () {
				mockCharm = {
					write: function (str) {
						mockCharm.out += str;
					}
				};
				mockCharm.out = '';
				pretty.charm = mockCharm;
			},

			'_Report': function () {
				var report = new pretty._Report();
				assert.deepEqual(report.environment, {});
				report.record(0);
				report.record(1);
				report.record(2);
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
						report = new pretty._Report('test');
						report.record(0);
						report.record(1);
						report.record(2);
						report.record(1);
						report.record(0);
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
				var report = new pretty._Report({
					browserName: 'chrome',
					version: '32.0.12'
				});
				report.record(0);
				report.record(1);
				report.record(2);
				report.total = 10;
				pretty._drawReporter(report, 80);
				assert.equal(mockCharm.out, 'Chr 32:   [✓~×       ]  3/10, 1 fail, 1 skip');
			}
		};
	});
});
