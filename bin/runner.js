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

function outputRpc(pretty, rpcent) {
  if (pretty) {
    logging.log('info', 'rpc:message', rpcent.toObject());
  } else {
    rpcent.output();
  }
}



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
      outputRpc = outputRpc.bind(outputRpc, true);
    } else {
      logging.logger = logging.rpcLogger;
      logging.color = false;
      color = color.bind(color, false);
      outputRpc = outputRpc.bind(outputRpc, false);
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
        logging.log('info', 'Warm up done - listening for requests...');

        jsonrpc.rpiecy.listen(request => {
          logging.log('info', 'on request: ', request);

          if (request.method === 'quit') {
            outputRpc(request);
            process.exit(1);
          }
          else if (
            request.method === 'delegate_local' &&
            request.params &&
            request.params.routine
          ) {
            let method = request.params.routine;
            let args = request.params.args || {};

            Promise.resolve(task[method](args))
              .then(resp => {
                let response = rpiecy.createResponse(request.id, { data: resp });
                outputRpc(response);
              })
              .catch(error => {
                let response = rpiecy.createResponse(request.id, null, {
                  code: jsonrpc.INTERNAL_ERROR,
                  data: error,
                  message: 'error running method'
                });
                outputRpc(response);
                process.exit(1);
              });
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
