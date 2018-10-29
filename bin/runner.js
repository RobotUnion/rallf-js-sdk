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
function color(colorEnabled, str, colorName) {
  if (colorEnabled) {
    try {
      str = clc[colorName](str);
    } catch (error) { }
  }
  return str;
}


// try {
//   let latestVersion = child_process.execSync(`npm show ${package.name} version`, { timeout: 8000 }).toString().trim();
//   if (latestVersion.toString() !== package.version.trim()) {
//     logging.log('warn', `"${package.name}" is not in the latest version, please consider updating`);
//   }
// } catch (error) { }
program
  .command('run')
  .option('-t --task <task>', 'path task, default to cwd')
  .option('-r --robot <robot>', 'what robot to be used', 'nullrobot')
  .option('-i --input <input>', 'tasks input')
  .option('-m --mocks <mocks>', 'mocks folder')
  .option('-f --method <method>', 'run method in skill')
  .option('-s --subroutines', 'shows all subroutines it has executed, list of fns')
  .option('-n --no-tty', 'shows output as is, without formatting')
  .action((cmd) => {
    let isTTY = process.stdin.isTTY && cmd.tty;

    if (isTTY) {
      logging.logger = logging.prettyLogger;
      logging.color = true;
      color = color.bind(color, true);
    } else {
      logging.logger = logging.rpcLogger;
      logging.color = false;
      color = color.bind(color, false);
    }

    logging.log('info', 'running command: run');

    let taskPath = cmd.task || cwd;
    let manifest = rallfRunner.getManifest(taskPath);
    if (manifest.error) {
      return logging.log('error', manifest.error);
    }

    let task = rallfRunner.createTask(taskPath, manifest, cmd.robot, cmd.mocks, isTTY);
    let taskLbl = color(task.getName() + '@' + task.getVersion(), 'green');

    logging.log('success', 'Running task: ' + taskLbl);
    logging.log('info', 'Created task');
    logging.log('info', 'Executing task');

    if (isTTY) {
      task.logger.pretty = true;
    } else {
      task.logger.pretty = false;
    }

    if (cmd.method) {
      return rallfRunner.runMethod(task, cmd.method, cmd.input, isTTY)
        .then(resp => {
          logging.log('success', `Method ${color(cmd.method, 'blackBright')} OK`);
          logging.log('success', `Result: ${color(resp.result, 'blackBright')}`);
          logging.log('success', `Time:   ${color(resp.execution_time + 's')}`);
          // logging.log('success', `Subroutines:   ${color(resp.subroutines.length)}`, resp.subroutines);
          process.exit(0);
        })
        .catch(async err => {
          logging.log('error', `Finished run method ${cmd.method} with ERROR`, err);
          process.exit(1);
        });
    }

    return rallfRunner.runTask(task, cmd.input, isTTY)
      .then(resp => {
        logging.log('success', 'Finished task OK');
        logging.log('success', `Result: ${color(resp.result, 'blackBright')}`);
        logging.log('success', `Time:   ${color(resp.execution_time + 's', 'blueBright')}`);

        if (resp.subroutines && cmd.subroutines) {
          logging.log('info', `Runned ${color(resp.subroutines.length, 'blueBright')} subroutines: `);
          resp.subroutines.forEach(el => {
            logging.log('info', `${el.method}() -> ${color(el.result || 'void', 'blueBright')} ${clc.green('@' + (el.exec_time / 1000) + 's')}`);
          });
        }

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
