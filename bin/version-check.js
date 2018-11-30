'use strict';
// const package = require('../package.json');
// const child_process = require('child_process');

module.exports = (ncv) => {
  if (!ncv) {
    const update = require('please-update');
    const pkg = require('../package.json');

    update.default({
      package: pkg.name,
      version: pkg.version
    }).then(() => {
      // logging.log('warn', `"${package.name}" is not in the latest version, please consider updating`);
    });
  }
};

