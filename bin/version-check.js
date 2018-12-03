'use strict';
// const package = require('../package.json');
// const child_process = require('child_process');

module.exports = async (ncv) => {
  if (!ncv) {
    console.log('asdasd');
    const update = require('please-update');
    const pkg = require('../package.json');

    await update.default({
      package: pkg.name,
      version: pkg.version
    }).then((res) => {
      console.log(`"${pkg.name}" is not in the latest version, please consider updating`);
    }).catch(err => {
      console.log(`"${pkg.name}" ` + err);
    });
  }
};

