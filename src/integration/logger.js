'use strict';

const loggin = require('loggin-js');

class Logger extends loggin.Logger {
  constructor(opts = {}, parent) {
    super(opts);
    this.task = parent;
    this.name = 'task-logger-instance';
  }

  capture(device, saveLocal = false) {
    return new Promise((resolve, reject) => {
      let fname = 'img_' + Date.now() + '.png';
      let captureFN = saveLocal
        ? device.saveScreenshot.bind(device, fname)
        : device.takeScreenshot;

      captureFN((error, capture) => {
        if (error) {
          this.error('error', {
            error
          });
          reject({
            error
          });
        } else {
          this.debug('capture: ' + fname, {
            capture
          });
          resolve({
            capture
          });
        }
      });
    });
  }
}

module.exports = Logger;
module.exports.Logger = loggin.Logger;