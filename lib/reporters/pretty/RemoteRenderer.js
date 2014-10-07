/**
 * Draw the results of a remote session
 *
 * 	IE 9:       Unit [✔︎~✔︎×✔︎✔︎✔︎✔︎✔︎✔︎] 100/100, 2 fail, 1 skip
 * 	Cov 100/89% Func [✔︎~✔︎×✔︎✔︎✔︎✔︎✔︎✔︎] 100/100, 2 fail, 1 skip
 * 	IE 10:      Unit [✔︎~✔︎×✔︎✔︎/   ]  65/100, 2 fail, 1 skip
 * 	            Func [          ]   0/100
 * 	Fx 24.0.1:  Unit [/         ]   2/100
 * 	            Func [          ]   0/100
 * 	Chr 32:     Starting
 *
 * 	Saf 7:      Pending
 *
 * 	Android 19: Pending
 */
define([ './StatusBar', './Results', 'dojo/node!util' ], function (StatusBar, Results, nodeUtil) {
	var PAD = '                                                    ';

	function RemoteRenderer(charm, type, title, numTests) {
		this.charm = charm;
		this._type = type;
		this._titleWidth = 12;
		this._results = null;
		this._statusBar = null;
		this.title = title;
		this.numTests = numTests;
		this._dirty = true;
	}

	RemoteRenderer.prototype = {
		constructor: RemoteRenderer,

		get height() {
			return 1;
		},

		get needsRender() {
			return this._dirty;
		},

		get numTests() {
			return (this._results && this._results.total) || 0;
		},

		set numTests(num) {
			if (num !== this.numTests && num > 0) {
				this._results = new Results(num, 10);
				this._statusBar = new StatusBar(this.charm, this._results);
				this._dirty = true;
			}
		},

		get title() {
			return this._title || '';
		},

		set title(str) {
			str = str || '';

			if (str) {
				var padLen = this._titleWidth - str.length - 2;
				var titleLen = Math.min(this._titleWidth - 2, str.length);
				this._title = str.substr(0, titleLen) + ': ' + PAD.substr(0, padLen);
			} else {
				this._title = PAD.substr(0, this._titleWidth);
			}
			this._dirty = true;
		},

		recordPassed: function () {
			this._dirty = true;
			this._results.recordPassed();
		},

		recordSkipped: function () {
			this._dirty = true;
			this._results.recordSkipped();
		},

		recordFailed: function () {
			this._dirty = true;
			this._results.recordFailed();
		},

		/**
		 * Render a single line
		 * TITLE:       TYPE [✔︎~✔︎×✔︎✔︎✔︎✔︎✔︎✔︎] 100/100, 2 fail, 1 skip
		 */
		render: function () {
			this.charm.write(this.title);
			this.charm.write(this._type);

			if (this._results) {
				this.charm.write(' [');
				this._statusBar.render();
				this.charm.write(nodeUtil.format('] %d/%d', this._results.complete, this._results.total));
				if (this._results.fail) {
					this.charm.write(nodeUtil.format(', %d fail', this._results.failed));
				}
				if (this._results.skip) {
					this.charm.write(nodeUtil.format(', %d skip', this._results.skipped));
				}
			}
			else {
				this.charm.write(' Pending');
			}
			this.charm.write('\n');
		}
	};

	return RemoteRenderer;
});