define([
	'./main',
	'./order',
	'./lib/EnvironmentType',
	'./lib/Suite',
	'./lib/Test',
	'./lib/args',
	'./lib/util',
	'./lib/reporterManager',
	'./lib/interfaces/tdd',
	'./lib/interfaces/bdd',
	'./lib/interfaces/object',
	'./lib/reporters/console',
	'./lib/reporters/pretty/Results',
	'dojo/has!host-node?./lib/reporters/pretty/prettyClient',
	'dojo/has!host-node?./lib/reporters/teamcity',
	'dojo/has!host-node?./lib/reporters/junit',
	'dojo/has!host-node?./lib/reporters/lcov'
], function () {});
