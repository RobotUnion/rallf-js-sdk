'use strict';
const loggin = require('loggin-js');
const pkg = require('../../package.json');

const logger = loggin.logger('console', {
  channel: pkg.name,
  formatter: process.env.LOGGER_FORMATTER || 'detailed',
  level: loggin.severity(process.env.DEBUG ? 'DEBUG' : 'INFO'),
});

module.exports.loggin = loggin;
module.exports.logger = logger;
