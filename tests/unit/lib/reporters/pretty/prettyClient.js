define([
	'intern!object',
	'intern/chai!assert',
	'../../../../../lib/reporters/pretty/prettyClient',
	'dojo/node!stream',
	'dojo/node!charm'
], function (registerSuite, assert, prettyClient, stream, charm) {
	var reporter, iostream;

	function WritableTestStream() {
		stream.Writable.apply(this, arguments);
		this.data = '';
	}
	
	WritableTestStream.prototype = Object.create(stream.Writable.prototype);
	WritableTestStream.prototype.write = function (chunk, encoding, callback) {
		this.data += chunk;
		callback && callback();
	};
	WritableTestStream.prototype.end = function (chunk, encoding, callback) {
		if (chunk) {
			this.write.apply(this, arguments);
		}
		this.emit('end');
	};
	WritableTestStream.prototype.toString = function () {
		return this.data;
	};

	function ReadableTestStream() {
		stream.Readable.apply(this, arguments);

	}
	ReadableTestStream.prototype = Object.create(stream.Readable.prototype);
	ReadableTestStream.prototype.read = function (len) {
		this.emit('end');
		return '';
	};
	ReadableTestStream.prototype.pipe = function (dest) {
		dest.end(this.read());
		return dest;
	};
	ReadableTestStream.prototype.destroy = function () { };


	registerSuite({
		name: 'intern/lib/reporters/pretty/prettyClient',

		'beforeEach': function () {
			iostream = new WritableTestStream();
			reporter = new prettyClient.constructor();
			reporter.charm = charm(iostream, new ReadableTestStream());
		},

		'test': function () {
			reporter.charm.write('expected');
			assert.notEqual(reporter.start, reporter.constructor.start);
			assert.strictEqual(iostream.data, 'expected');
		},

		'afterEach': function () {
			reporter.destroy();
		}
	});
});