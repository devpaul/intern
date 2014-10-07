define([ 'dojo/Evented' ], function (Evented) {
	var combinedStatus = {
		pass : { pass: 'pass', fail: 'fail', skip: 'skip', pending: 'pending' },
		fail : { pass: 'fail', fail: 'fail', skip: 'fail', pending: 'fail' },
		skip : { pass: 'skip', fail: 'fail', skip: 'skip', pending: 'skip' },
		pending : { pass: 'pending', fail: 'fail', skip: 'skip', pending: 'pending' }
	};

	function Results(totalTests, maxGroups) {
		Evented.apply(this, arguments);
		this.total = totalTests;
		this.passed = 0;
		this.failed = 0;
		this.skipped = 0;
		this.complete = 0;

		this.maxGroups = maxGroups;
		this.numGroups = Math.min(totalTests, maxGroups);
		this._results = new Array(totalTests);
		this._groupResults = new Array(this.numGroups);
	}

	Results.prototype = Object.create(Evented.prototype);
	Results.prototype.isComplete = function () {
		return this.complete >= this.total;
	};

	Results.prototype.recordPassed = function () {
		this.passed++;
		this._results[this.complete] = 'pass';
		this._recordGroupResult(this.complete, 'pass');
		this.complete++;
	};

	Results.prototype.recordFailed = function () {
		this.failed++;
		this._results[this.complete] = 'fail';
		this._recordGroupResult(this.complete, 'fail');
		this.complete++;
	};

	Results.prototype.recordSkipped = function () {
		this.skipped++;
		this._results[this.complete] = 'skip';
		this._recordGroupResult(this.complete, 'skip');
		this.complete++;
	};

	Results.prototype.getStatus = function (testNum) {
		return this._results[testNum] || 'pending';
	};

	Results.prototype.getGroup = function (testNum) {
		var overflow = (this.total % this.numGroups);
		var minGroupSize = (this.total - (this.total % this.numGroups)) / this.numGroups;
		var maxGroupSize = overflow ? minGroupSize + 1 : minGroupSize;
		var threshold = (overflow * maxGroupSize);
		var below = Math.min(testNum, threshold);
		var above = Math.max(0, testNum - below);
		var belowCalc = (below - (below % maxGroupSize)) / maxGroupSize;
		var aboveCalc = (above - (above % minGroupSize)) / minGroupSize;
		return belowCalc + aboveCalc;
	};

	Results.prototype.getGroupResult = function (group) {
		return this._groupResults[group] || 'pending';
	};

	Results.prototype._recordGroupResult = function (testNum, result) {
		var currentGroup = this.getGroup(testNum);
		var currentGroupResult = this.getGroupResult(currentGroup);
		var groupStatus = combinedStatus[currentGroupResult][result];
		var isLastInGroup = testNum + 1 === this.total || currentGroup !== this.getGroup(testNum + 1);

		if (isLastInGroup && groupStatus === 'pending') {
			groupStatus = 'pass';
		}

		this._groupResults[currentGroup] =  groupStatus;

		if (isLastInGroup) {
			this.emit('groupStatus', { group: currentGroup, result: groupStatus });
		}
	};

	return Results;
});