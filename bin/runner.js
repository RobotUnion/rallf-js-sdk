#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const clc = require('cli-color');
const program = require('commander');
const readline = require('readline');
const logging = require('../src/lib/logging');
const package = require('../package.json');
const child_process = require('child_process');
const jsonrpc = require('../src/lib/jsonrpc');



// let stdinPut = null;
// inputReader.on('line', (line) => {
//   console.log("Line ", line);
//   stdinPut = line;
// });

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

// process.on('unhandledRejection', r => console.log(r));

program
  .command('run')
  .option('-t --task <task>', 'path task, default to cwd')
  .option('-r --robot <robot>', 'what robot to be used', 'nullrobot')
  .option('-i --input <input>', 'tasks input')
  .option('-m --mocks <mocks>', 'mocks folder')
  .option('-f --method <method>', 'run method in skill')
  .option('-s --subroutines', 'shows all subroutines it has executed, list of fns')
  .option('-n --no-tty', 'shows output as is, without formatting')
  .option('-I --interactive', 'shows prompt to interact with the task via stdin')
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

    if (cmd.input) {
      try {
        cmd.input = JSON.parse(cmd.input)
      } catch (error) {
        throw new Error(`Error parsing input, must be valid json: ${cmd.input}`);
      }
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

    let result;

    if (!cmd.method && task.isTask()) {
      cmd.method = 'start';
    } else if (!cmd.method) {
      cmd.method = 'warmup';
    }

    rallfRunner.runMethod(task, cmd.method, cmd.input, isTTY)
      .then(resp => {
        logging.log('success', `Method ${color(cmd.method, 'blackBright')} OK`);
        logging.log('success', `Result: ${color(resp.result, 'blackBright')}`);
        logging.log('success', `Time:   ${color(resp.execution_time + 's')}`);
        process.exit(0);
      })
      .catch(async err => {
        logging.log('error', `Finished method ${cmd.method} with ERROR ` + err.stack);
        await task.devices.quitAll();
        process.exit(1);
      });

    if (task.isSkill()) {
      task.on('wamup:end', () => {
        logging.log('info', 'Sending request');

        let inputReader = readline.createInterface({ input: process.stdin });
        inputReader.on('line', async (line) => {
          logging.log('info', 'on line: ' + line);
          try {
            let request = JSON.parse(line);

            if (request.method === 'run-method' && request.params && request.params.method) {
              let params = { ...request.params };
              let method = params.method;
              delete params.method;

              await Promise.resolve(task[method](params)).catch(error => {
                console.log(jsonrpc.error(request.method, request.id, jsonrpc.INTERNAL_ERROR, 'internal-error', error));
                process.exit(1);
              });
            }
          } catch (error) {
            console.log(jsonrpc.error('unknown', 'unknown', jsonrpc.INTERNAL_ERROR, 'parse-error', error));
            process.exit(1);
          }
        });
      });
    } else {
      return result;
    }
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
