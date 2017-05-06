#!/usr/bin/env node
'use strict';
const fs   = require('fs');
const clc  = require('cli-color');
const CWD  = process.cwd();
const ARGS = process.argv.slice(2);

/* TODO: add flags, one for hiding logs */
let log     = process.stdout;
let lgray   = clc.xterm(59).bold;
let info    = clc.xterm(23);
let red     = clc.xterm(9);
let warning = clc.xterm(3);
let success = clc.xterm(28);
let errorcl = clc.xterm(1);
let JSZip   = require("jszip")();

function addFile(path) {
  log.write('  Processing: '+lgray(path)+'\n');
  JSZip.file(path, fs.readFileSync(CWD+'/'+path));
}
function addFolder(path) {
  log.write('  Processing: '+info(path)+'\n');
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

let manifestPath = `${CWD}/config/manifest.json`;
let config;
if (fs.existsSync(manifestPath)) {
  config = require(manifestPath);
}

log.write(`Started packaging development ${config ? '['+success(config.name)+']': ''}...\n`);

if(!fs.existsSync(CWD+'/out')) {
  console.log(`[${info('info')}] Created ${info('out')} folder.\n`);
  fs.mkdirSync('out');
}
addFolder('src');
addFolder('config');
addFile('package.json');

JSZip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
  .pipe(fs.createWriteStream(CWD+'/out/app.tsk'))
  .on('finish', function () {
    console.log("\n["+success('ok')+"] Development packed to "+info('out/app.tsk'));
  });
