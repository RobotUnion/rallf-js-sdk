#!/usr/bin/env node
'use strict';
const fs = require('fs');
const CWD = process.cwd();
var JSZip = require("jszip")();


if(!fs.existsSync(CWD+'/out')) fs.mkdirSync('out');
JSZip.folder('src', CWD+'/src');
JSZip.folder('src', CWD+'/src');
JSZip.file('composer.json', CWD+'/composer.json');

JSZip.generateNodeStream({type:'nodebuffer', streamFiles:true})
  .pipe(fs.createWriteStream(CWD+'/out/app.tsk'))
  .on('finish', function () {
    console.log("Development packed to 'out/app.tsk'");
  });
