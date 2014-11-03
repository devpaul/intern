define([
	'intern!object',
	'intern/chai!assert',
	'../../../../lib/reporters/pretty'
], function (registerSuite, assert, pretty) {
	registerSuite({
		name: 'intern/lib/reporters/pretty',

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
		}
	});
});
