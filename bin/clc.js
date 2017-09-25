const clc = require('cli-color');
let log     = process.stdout;
let lgray   = clc.xterm(59).bold;
let info    = clc.xterm(23);
let red     = clc.xterm(9);
let warning = clc.xterm(3);
let success = clc.xterm(28);
let errorcl = clc.xterm(1);
let readline  = require('readline');
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

module.exports = {
  clc, log, lgray, info, red, warning, success, errorcl, rl
}
