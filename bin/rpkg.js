#!/usr/bin/env node
'use strict';
const fs = require('fs');
const CWD = process.cwd();
var JSZip = require("jszip")();

function addFile(path) {
  JSZip.file(path, fs.readFileSync(CWD+'/'+path));
}
function addFolder(path) {
  JSZip.folder(path);
  let files = fs.readdirSync(CWD+'\\'+path);
  files.forEach(file => {
    if (fs.lstatSync(path+'\\'+file).isDirectory()) {
      addFolder(path+'\\'+file);
    }
    else {
      addFile(path+'/'+file);
    }
  })
}

if(!fs.existsSync(CWD+'/out')) fs.mkdirSync('out');
addFolder('src');
addFolder('config');
addFile('package.json')

JSZip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
  .pipe(fs.createWriteStream(CWD+'/out/app.tsk'))
  .on('finish', function () {
    console.log("Development packed to 'out/app.tsk'");
  });
