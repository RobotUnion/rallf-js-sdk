#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const clc = require('cli-color');
const program = require('commander');
const readline = require('readline');
const logging = require('../src/lib/logging');
const jsonrpc = require('../src/lib/jsonrpc');
const now = require('../src/lib/now');
const package = require('../package.json');
const child_process = require('child_process');
const rpiecy = require('json-rpiecy');


program.version(package.version);

program.option('--nvc', 'Don\'t check version', false);

if (!process.argv.includes('--nvc')) {
  try {
    let latestVersion = child_process.execSync(`npm show ${package.name} version`, { timeout: 8000 }).toString().trim();
    if (latestVersion.toString() !== package.version.trim()) {
      logging.log('warn', `"${package.name}" is not in the latest version, please consider updating`);
    }
  } catch (error) { }
}

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

  if (!rpcent.output && rpcent.method) {
    rpcent = rpiecy.createRequest(rpcent.method, rpcent.params, rpcent.id);
  }
  if (!rpcent.output && rpcent.result || rpcent.error) {
    rpcent = rpiecy.createResponse(rpcent.id, rpcent.result, rpcent.error);
  }

  if (pretty) {
    logging.log('info', 'rpc:message', rpcent.toObject());
  } else {
    rpcent.output();
  }
}

function onFinish(resp, cmd, task) {
  logging.log('success', `Finished ${task.id} ${color('OK', 'green')} ${JSON.stringify(resp)}`);
  process.exit('SIGINT');
}

const finish = (data, cmd, task) => {
  let request = rpiecy.createRequest('finish', data, rpiecy.id());
  onFinish(request, cmd, task);
}

// const now = (unit) => {
//   const hrTime = process.hrtime();
//   switch (unit) {
//     case 'milli':
//       return hrTime[0] * 1000 + hrTime[1] / 1000000;
//     case 'micro':
//       return hrTime[0] * 1000000 + hrTime[1] / 1000;
//     case 'nano':
//       return hrTime[0] * 1000000000 + hrTime[1];
//     default:
//       return hrTime[0] * 1000000000 + hrTime[1];
//   }

// };

program
  .command('run')
  .option('-t --task <task>', 'path task, default to cwd')
  .option('-r --robot <robot>', 'what robot to be used', 'nullrobot')
  .option('-i --input <input>', 'tasks input')
  .option('-m --mocks <mocks>', 'mocks folder')
  .option('-f --method <method>', 'run method in skill', 'warmup')
  .option('-s --subroutines', 'shows all subroutines it has executed, list of fns')
  .option('-T --tty', 'if TTY should be set', true)
  .option('-I --interactive', 'shows prompt to interact with the task via stdin')
  .option('-v --verbose', 'shows  verbose logging', false)
  .action((cmd) => {
    let isTTY = process.stdin.isTTY || cmd.tty;

    // console.log('isTTY', isTTY);


    if (!isTTY) {
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
    let taskLbl = color(task.name + '@' + task.version + 'green');

    logging.log('success', 'Running task: ' + taskLbl);
    logging.log('info', 'Created task');
    logging.log('info', 'Executing task');

    if (!isTTY) {
      task.logger.pretty = true;
    } else {
      task.logger.pretty = false;
    }


    rallfRunner.runMethod(task, cmd.method, cmd.input, isTTY)
      .then(resp => {
        logging.log('info', `Received response for ${color(cmd.method, 'blueBright')}(${color(JSON.stringify(cmd.input), 'blackBright')}): ${JSON.stringify(resp.result)}`);
      })
      .catch(async err => {
        logging.log('error', `Finished method ${cmd.method} with ERROR ` + err.stack);
        await task.devices.quitAll();
        process.exit(1);
      });

    task.on('warmup:end', () => {
      logging.log('info', 'Warm up done - listening for requests...');
      rpiecy.listen(request => {
        if (request.id) {
          if (request.method === 'quit') {
            task.devices.quitAll().then(x => {
              onFinish(request, cmd, task);
            });
          }
          else if (
            request.method === 'run-method' &&
            request.params &&
            request.params.routine
          ) {
            let method = request.params.routine;
            let args = request.params.args || {};

            now.timeFnExecutionAsync(() => task[method](args))
              .then((res) => {
                logging.log('info', `Timed: `, res);
                let response = rpiecy.createResponse(request.id, { timed: res.timed, info: { method, args, result: res.return } }, null);
                response.output();
              })
              .catch(err => {
                let response = rpiecy.createResponse(request.id, null, {
                  code: jsonrpc.INTERNAL_ERROR,
                  data: err,
                  message: 'error running method'
                });
                response.output();
                process.exit(1);
              });
          } else if (request.result || request.error) {
            task.emit('response:' + request.id, request);
          }
        } else if (cmd.verbose) {
          logging.log('info', `Received request without id`, request);
        }
      });
    });

    // if (task.isTask()) {
    task.on('finish', async (data) => {
      await task.devices.quitAll();
      finish(data, cmd, task);
    });
    // }

    task.once('error', async (err) => {
      logging.log('error', `Finished method ${cmd.method} with ERROR ` + err);
      await task.devices.quitAll();
      process.exit(1);
    });

    // On any event
    task.onAny = (evt, data) => {
      // logging.log('info', `received event: ${evt}`, data);
      let request = rpiecy.createRequest('event', {
        event: evt,
        data: data || {}
      }, rpiecy.id());
      request.output();
      // logging.log('info', `Send request: ${request.toString()}`);
    };

    process.on('SIGINT', async () => {
      await task.devices.quitAll();
      finish({}, cmd, task);
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
