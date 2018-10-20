'use strict';
const clc = require('cli-color');

module.exports = {
  padd(str) {
    return ` ${str} `;
  },
  getClFromType(type) {
    switch (type) {
      case 'error': return clc.bgRedBright;
      case 'info': return clc.bgBlueBright;
      case 'success': return clc.bgGreenBright;
      case 'warn': return clc.bgYellowBright;
      default: return clc.blackBright;
    }
  },

  // Ugly, improve
  log(type, msg, data) {
    let cl = this.getClFromType(type);
    let segments = [
      cl(this.padd(type.toUpperCase().substr(0, 3))),
      '(' + clc.blackBright('runner') + ')',
      (msg),
      data ? this.getClFromType()(JSON.stringify(data, null, 2)) : null,
    ].filter((x) => x);
    let str = segments.join(' - ');
    console.log(str);
  }
};