#!/usr/bin/env node

'use strict';

const child_process = require('child_process');
const clc = require('cli-color');
const path = require('path');
const program = require('commander');
const logging = require('../src/lib/logging');
const jsonrpc = require('../src/lib/jsonrpc');
const now = require('../src/lib/now');
const pkg = require('../package.json');
const rpiecy = require('json-rpiecy');
const checkVersion = require('./version-check');

checkVersion(process.argv.includes('--nvc'))
  .then(goAhead)
  .catch(goAhead);


function goAhead() {
  const Runner = require('../src/lib/runner');
  const rallfRunner = new Runner();

  let cwd = process.cwd();

  function color(colorEnabled, str, colorName) {
    if (colorEnabled) {
      try {
        str = clc[colorName](str);
      } catch (error) {}
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
    process.exit(0);
  }

  const finish = (data, cmd, task) => {
    let request = rpiecy.createRequest('finish', data, rpiecy.id());
    onFinish(request, cmd, task);
  };

  async function finishHandler(task, cmd, isTTY) {
    task._hasDoneWarmup(true);
    await rallfRunner.runMethod(task, 'cooldown', [], isTTY);
    try {
      await task.devices.quitAll();
    } catch (error) {};
    return finish({}, cmd, task);
  }

  function pipeSubcommandOutput(cp) {
    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);
  }


  program.version(pkg.version, '-v --version');
  program.option('-V --verbose', 'show verbose logging', false)
  program.option('-N --nvc', 'don\'t check version', false);

  program
    .command('init')
    .option('-s, --skill', 'generate skill template')
    .option('-f, --force', 'rorce the generation, under your own risk!')
    .action((cmd) => {
      let cp = child_process.fork(path.join(__dirname, '../bin/init.js'), [...process.argv.slice(3)], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
      });
      pipeSubcommandOutput(cp);
    });

  program
    .command('package')
    .option('-i, --input-path <input_path>', 'specify an input path', path.join(process.cwd()))
    .option('-o, --output-path <output_path>', 'specify an output path', path.join(process.cwd(), 'output'))
    .action((cmd) => {
      let cp = child_process.spawn('node', [path.join(__dirname, '../bin/packager.js'), ...process.argv.slice(3)], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
      });
      pipeSubcommandOutput(cp);
    });

  program
    .command('run')
    .option('-t --task <task>', 'path task, default to cwd')
    .option('-r --robot <robot>', 'what robot to be used', 'nullrobot')
    .option('-i --input <input>', 'tasks input', {})
    .option('-m --mocks <mocks>', 'mocks folder')
    .option('-f --method <method>', 'run method in skill', 'warmup')
    .option('-T --tty', 'if TTY should be set', true)
    .option('-p --pretty', 'show pretty output', false)
    .action((cmd, args) => {
      let isTTY = process.stdin.isTTY || cmd.tty;
      if (cmd.pretty || !isTTY) {
        logging.logger = logging.prettyLogger;
        logging.color = true;
        color = color.bind(this, true);
        outputRpc = outputRpc.bind(this, true);
      } else {
        logging.logger = logging.rpcLogger;
        logging.color = false;
        color = color.bind(color, false);
        outputRpc = outputRpc.bind(outputRpc, false);
      }

      if (cmd.input) {
        try {
          cmd.input = JSON.parse(cmd.input);
        } catch (error) {
          logging.log('warning', 'Error parsing input, must be valid json', cmd.input);
          cmd.input = {};
        }
      } else {
        cmd.input = {};
      }

      logging.log('info', 'running command: run', null);

      let taskPath = cmd.task || cwd;
      let manifest = rallfRunner.getManifest(taskPath);
      if (manifest.error) {
        return logging.log('error', manifest.error);
      }

      let task;

      try {
        task = rallfRunner.createTask(taskPath, manifest, cmd.robot, cmd.mocks, isTTY);

        let taskLbl = color(task.name + '@' + task.version + 'green');

        logging.log('debug', 'Running task: ' + taskLbl);
        logging.log('debug', 'Created task');
        logging.log('debug', 'Executing task');

        if (cmd.pretty || !isTTY) {
          task.logger.pretty = true;
        } else {
          task.logger.pretty = false;
        }


        // On any event
        task.onAny = (evt, data) => {
          let request = rpiecy.createRequest('event', {
            name: evt,
            content: data || {},
            context: task.fqtn,
            time: now()
          }, rpiecy.id());
          outputRpc(request);
          // request.output();
        };

        /* Handle sigint before readline is active */
        process.once('SIGINT', () => {
          return finishHandler(task, cmd, isTTY);
        });

        process.once('close', () => {
          return finishHandler(task, cmd, isTTY);
        });

        const methodsAllowed = ['delegate', 'event', 'quit'];
        task.on('routine:end', (params) => {
          if (params.name === 'warmup') {
            logging.log('debug', 'Warm up done - listening for requests...');

            /* rpiecy.listen Sets up a realine inteface that listens for json-rpc requests/responses */
            const input = rpiecy.listen((request) => {
              if (request.method && !methodsAllowed.includes(request.method)) {
                let response = rpiecy.createResponse(request.id, null, {
                  message: 'Method "' + request.method + '" not found.',
                  code: -32601,
                  data: {}
                });
                outputRpc(response);
              } else if (request.id) {
                if (
                  request.method === 'delegate' &&
                  request.params
                ) {
                  let method = request.params.routine;
                  let args = request.params.args || {};

                  now.timeFnExecutionAsync(() => task[method](args))
                    .then((res) => {
                      logging.log("info", "Finshed: ", res);
                      let response = rpiecy.createResponse(request.id, res.return, null);
                      outputRpc(response);
                    })
                    .catch((err) => {
                      let response = rpiecy.createResponse(request.id, null, {
                        code: jsonrpc.INTERNAL_ERROR,
                        data: err,
                        message: 'error running method'
                      });
                      outputRpc(response);
                      process.exit(1);
                    });
                } else if (request.result || request.error) {
                  task.emit('response:' + request.id, request.result);
                }
              } else if (cmd.verbose) {
                logging.log('debug', 'Received request without id', request);
              }
            });

            /* Handle sigint for readline, as process.on will not receive the event */
            input.once('SIGINT', () => {
              return finishHandler(task, cmd, isTTY);
            });

            input.once('close', () => {
              return finishHandler(task, cmd, isTTY);
            })
          }
        });

        rallfRunner.runMethod(task, cmd.method, cmd.input, isTTY)
          .then((resp) => {
            logging.log('debug', `Received response for ${color(cmd.method, 'blueBright')}(${color(JSON.stringify(cmd.input), 'blackBright')}): ${JSON.stringify(resp.result)}`);
          })
          .catch((err) => {
            console.log(err);
            logging.log('error', `Finished method ${cmd.method} with ERROR `, err);
            task.devices.quitAll().then(resp => {
              process.exit(1);
            });
          });
      } catch (error) {
        console.log('error', error);
        logging.log('error', `Finished method ${cmd.method} with ERROR `, error);
        if (task) task.devices.quitAll().then(resp => {
          process.exit(1);
        });
      }
    });

  program.parse(process.argv);
}