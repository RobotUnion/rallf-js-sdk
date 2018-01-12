const clc = require('cli-color');
let log     = process.stdout;
let lgray   = clc.xterm(59).bold;
let info    = clc.xterm(23);
let error     = clc.xterm(9);
let warning = clc.xterm(3);
let success = clc.xterm(28);
let errorcl = clc.xterm(1);
let readline  = require('readline');
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/*
  Overrite rl.close because original close method was not working
  Below code does what expected
  TODO: Check in future to see if original method works
*/
rl.close = function () {
  process.exit();
}

module.exports = {
  clc, log, lgray, info, error, warning, success, errorcl, rl
}
