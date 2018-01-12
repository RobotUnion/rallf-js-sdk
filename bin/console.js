'use strict';
const clc = require('cli-color');
let log = process.stdout;
let lgray = clc.xterm(59).bold;
let info = clc.xterm(23);
let error = clc.xterm(9);
let warning = clc.xterm(3);
let magenta = clc.xterm(88);
let readline = require('readline');
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Logger {
  constructor() { }

  log(xtermValue) {
    return clc.xterm(xtermValue);
  }
  error(str) {
    return this.log(9)(str);
  }
  info(str) {
    return this.log(32)(str);
  }
  success(str) {
    return this.log(40)(str);
  }
  warning(str) {
    return this.log(3)(str);
  }
  lgray(str) {
    return this.log(59).bold(str);
  }
  number(n) {
    return clc.magenta.bold(n);
  }
}

rl.close = function () {
  process.exit();
}

module.exports = {
  logger: new Logger(),
  readLine: rl,
  log
}
