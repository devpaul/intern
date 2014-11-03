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
			},

			'_Report': function () {
				var report = new pretty._Report('type');
				assert.deepEqual(report.type, 'type');
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

			'_drawProgressBar': function () {
				var report = new pretty._Report('test');
				report.record(0);
				report.record(1);
				report.record(2);
				report.record(1);
				report.record(0);
				report.total = 10;
				pretty._drawProgressBar(report, 20, mockCharm);
				assert.equal(mockCharm.out, '[✓~×~✓       ]  5/10');

				report.total = 100;
				mockCharm.out = '';
				pretty._drawProgressBar(report, 20, mockCharm);
				assert.equal(mockCharm.out, '[×         ]   5/100');
			}
		};
	});
});
