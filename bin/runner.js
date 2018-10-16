#!/usr/bin/env node --no-warnings

const path = require('path');
const fs = require('fs-extra');
const clc = require('cli-color');
const program = require('commander');
const logging = require('../src/lib/logging');
const package = require('../package.json');
const child_process = require('child_process');

program.version(package.version);

const Runner = require('../src/lib/runner');
const rallfRunner = new Runner();

let cwd = process.cwd();

try {
  let latestVersion = child_process.execSync(`npm show ${package.name} version`);

  if (latestVersion !== package.version) {
    logging.log('warn', `"${package.name}" is not in the latest version, please consider updating`);
  }
} catch (error) { }


program
  .command('run')
  .option('-t --task <task>', 'path task, default to cwd')
  .option('-m --mock <mock>', 'what mock to be used')
  .option('-i --input <input>', 'tasks input')
  .action(function (cmd) {
    logging.log('info', 'running command: run');

    let taskPath = cmd.task || cwd;

    logging.log('info', 'task path is: ' + taskPath);

    let manifest = rallfRunner.getManifest(taskPath);

    logging.log('info', 'manifest is: ', manifest);

    let mock = null;
    if (cmd.mock) {
      mock = rallfRunner.getMock(taskPath, cmd.mock);
      if (mock === null) {
        return logging.log('error', `Could not find mock "${cmd.mock}", please make sure it exists at: ${taskPath}/mocks/${cmd.mock}.mock.js`);
      }
    }

    let task = rallfRunner.createTask(taskPath, manifest, cmd.input, mock);

    logging.log('info', 'created task: ' + task.getName() + '@' + task.getVersion());

    rallfRunner.runTask(task);
  });

program.parse(process.argv);




