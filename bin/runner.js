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

// try {
//   let latestVersion = child_process.execSync(`npm show ${package.name} version`);
//   if (latestVersion.toString() !== package.version) {
//     logging.log('warn', `"${package.name}" is not in the latest version, please consider updating`);
//   }
// } catch (error) { }

program
  .command('run')
  .option('-t --task <task>', 'path task, default to cwd')
  .option('-m --mock <mock>', 'what mock to be used')
  .option('-i --input <input>', 'tasks input')
  .action((cmd) => {
    logging.log('info', 'running command: run');

    let taskPath = cmd.task || cwd;
    let manifest = rallfRunner.getManifest(taskPath);
    if (manifest.error) {
      return logging.log('error', manifest.error);
    }

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

        let execTimeLbl = clc.bgWhite.blackBright(' execution time ') + clc.bgGreen(` ${resp.execution_time} `);

        logging.log('success', 'Finished task OK');
        logging.log('success', `Result: ${clc.blackBright(resp.result)}`);
        logging.log('success', `Time:   ${clc.blueBright(resp.execution_time + 's')}`);
        process.exit(0);
      })
      .catch(err => {
        logging.log('error', 'Finished task with ERROR', err);
        process.exit(1);
      });
  });

program
  .command('send-event <name> <type> [data]')
  .option('-t --task <task>', 'path task, default to cwd')
  .action((name, type, data = {}, cmd) => {
    logging.log('info', 'running command: send-event ', { name, type, data });
    let taskPath = cmd.task || cwd;
    let pipePath = path.join(taskPath, '.rallf', 'event-pipe');
    logging.log('info', 'pipe path', pipePath);
    if (!fs.existsSync(pipePath)) {
      return logging.log('error', 'Oopsy, it seams task is not running... or pipe is not available');
    }
    else {
      fs.writeFileSync(pipePath, `${name}:${type} ${JSON.stringify(data)}`);
      return logging.log('info', 'Sent event');
    }
  });

program.parse(process.argv);
