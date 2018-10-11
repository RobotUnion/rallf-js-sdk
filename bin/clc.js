const clc = require('cli-color');

const padd = (str) => ` ${str} `;

let log = process.stdout;
let lgray = clc.xterm(59).bold;
let info = x => clc.bgBlueBright(padd(x));
let error = x => clc.bgRedBright(padd(x));
let warning = x => clc.bgYellowBright.black(padd(x));
let success = x => clc.bgGreenBright(padd(x));
let errorcl = clc.xterm(1);
let readline = require('readline');
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
