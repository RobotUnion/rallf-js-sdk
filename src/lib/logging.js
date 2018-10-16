'use strict';
const clc = require('cli-color');

module.exports = {
  getClFromType(type) {
    switch (type) {
      case 'error': return clc.redBright;
      case 'info': return clc.blueBright;
      case 'success': return clc.greenBright;
      case 'warn': return clc.yellowBright;
      default: return clc.blackBright;
    }
  },
  log(type, msg, data) {
    let cl = this.getClFromType(type);
    let segments = [
      cl(type.toUpperCase()),
      (msg),
      data ? this.getClFromType()(JSON.stringify(data)) : null,
    ].filter(x => x);
    let str = segments.join(' - ');
    console.log(str);
  }
};