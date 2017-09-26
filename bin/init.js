#!/usr/bin/env node
'use strict';

const fs       = require('fs');
const readline = require('readline');
const CWD      = process.cwd();
const rl       = readline.createInterface({input: process.stdin, output: process.stdout});
const _package = require(CWD+'/package.json');


let manifestTmplt = {
  "name": "",
  "description": "",
  "type": "web",
  "main": "src/app.js",
  "debug_url": "https://api-staging.robotunion.net",
  "version_name": "1.0.0",
  "code_version": 0,
  "key": "",
  "secret": ""
}

let log = console.log;

log(
  `
  This tool will help you create the manifest.json file.
  Can be changed later.
  Press ctrl-C at any time to quit.
  `
);

function writeManifest(manifest) {
  let cfigPath = CWD+'/config';
  let manifestStr = JSON.stringify(manifest, null, 4);
  if(!fs.existsSync(cfigPath)) fs.mkdirSync(cfigPath);
  fs.writeFileSync(cfigPath+'/manifest.json', manifestStr, 'utf8');
  rl.close();
  console.log(manifestStr);
}

let keys = Object.keys(manifestTmplt);
let klength = keys.length;

/* Asks for each field in manifestTmplt */
(function ask (i) {
  let key = keys[i];
  let packageKey = _package[key];
  let mkey = manifestTmplt[key];
  rl.question(
    `   ${key}${(packageKey || mkey) ? ' ('+(packageKey || mkey)+')': ''}: `,
    function (value) {
      manifestTmplt[key] = value || packageKey || mkey;
      if (i < klength-1) ask(++i)
      else writeManifest(manifestTmplt)
    }
  );
})(0);
