#!/usr/bin/env node
'use strict';

/*
  rpkg - Used for packaging task into a .tsk file
*/

const fs    = require('fs');
const clc   = require('cli-color');
const CWD   = process.cwd();
const JSZip = require("jszip")();
const ARGS  = process.argv.slice(2);

let stdout  = process.stdout;
let lgray   = clc.xterm(59).bold;
let info    = clc.xterm(23);
let red     = clc.xterm(9);
let warning = clc.xterm(3);
let success = clc.xterm(28);
let errorcl = clc.xterm(1);
let log     = () => {};

/* Show logs if -l flag is passed */
if (ARGS[0] == '-l') {
  log = (message) => process.stdout.write(message);
}

let manifestPath = `${CWD}/config/manifest.json`;
let config;
if (fs.existsSync(manifestPath)) {
  config = require(manifestPath);
}

console.log(`Started packaging development ${config ? '['+success(config.name)+']': ''}...`);

if(!fs.existsSync(CWD+'/out')) {
  console.log(`[${info('info')}] Created ${info('out')} folder.`);
  fs.mkdirSync('out');
}
addFolder('src');
addFolder('config');
addFile('package.json');

JSZip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
  .pipe(fs.createWriteStream(CWD+'/out/app.tsk'))
  .on('finish', function () {
    console.log("["+success('ok')+"] Development packed to "+info('out/app.tsk'));
  });


function addFile(path) {
  log('  Processing: '+lgray(path)+'\n');
  JSZip.file(path, fs.readFileSync(CWD+'/'+path));
}
function addFolder(path) {
  log('  Processing: '+info(path)+'\n');
  JSZip.folder(path);
  let files = fs.readdirSync(CWD+'/'+path);
  files.forEach(file => {
    if (fs.lstatSync(path+'/'+file).isDirectory()) {
      addFolder(path+'/'+file);
    }
    else {
      addFile(path+'/'+file);
    }
  })
}
