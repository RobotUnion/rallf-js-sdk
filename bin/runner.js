#!/usr/bin/env node

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
    let manifest = rallfRunner.getManifest(taskPath);

    let mock = null;
    if (cmd.mock) {
      mock = rallfRunner.getMock(taskPath, cmd.mock);
      if (mock === null) {
        return logging.log('error', `Could not find mock "${cmd.mock}", please make sure it exists at: ${taskPath}/mocks/${cmd.mock}.mock.js`);
      }
    }

    let task = rallfRunner.createTask(taskPath, manifest, cmd.input, mock);
    let taskLbl = clc.green(task.getName() + '@' + task.getVersion());

    logging.log('success', 'Running task: ' + taskLbl);
    logging.log('info', 'Created task');
    logging.log('info', 'Executing task');

    rallfRunner.runTask(task)
      .then(resp => {
        logging.log('success', 'Finished task OK', resp);
        process.exit(0);
      })
      .catch(err => {
        logging.log('error', 'Finished task with ERROR', err);
        process.exit(1);
      });
  });


program.parse(process.argv);
// if (program.args.length <= 1) program.outputHelp();

