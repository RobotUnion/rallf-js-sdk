#!/usr/bin/env node

'use strict';

const child_process = require('child_process');
const clc = require('cli-color');
const path = require('path');
const program = require('commander');
const rpiecy = require('json-rpiecy');

const { logger } = require('../src/lib/logging');
const jsonrpc = require('../src/lib/jsonrpc');
const now = require('../src/lib/now');
const pkg = require('../package.json');
const checkVersion = require('./version-check');

checkVersion(process.argv.includes('--nvc'))
  .then(goAhead)
  .catch(goAhead);

const FLAGS = {
  color: true,
  pretty: true,
};

function goAhead() {
  const Runner = require('../src/lib/runner');
  const rallfRunner = new Runner();

  let cwd = process.cwd();

  function color(str, colorName) {
    if (FLAGS['color']) {
      try {
        str = clc[colorName](str);
      } catch (error) { }
    }

    return str;
  }

  function outputRpc(rpcent) {
    if (FLAGS['pretty'] && !rpcent.isEmpty()) {
      logger.debug(rpcent.method, rpcent.params);
    } else {
      rpiecy.output(rpcent);
    }
  }

  function onFinish(resp, cmd, task) {
    logger.info(`Finished ${task.id} ${color('OK', 'green')} ${JSON.stringify(resp)}`);
    process.exit(0);
  }

  function finish(data, cmd, task) {
    let request = rpiecy.createRequest('finish', data, rpiecy.id());
    onFinish(request, cmd, task);
  };

  async function finishHandler(task, cmd, isTTY) {
    task._hasDoneWarmup(true);
    await rallfRunner.runMethod(task, 'cooldown', [], isTTY);
    try {
      await task.devices.quitAll();
    } catch (error) { };
    return finish({}, cmd, task);
  }

  function pipeSubcommandOutput(cp) {
    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);
  }

  program.version(pkg.version, '-v --version');
  program.option('-V --verbose', 'Show verbose logging', false)
  program.option('-N --nvc', 'Don\'t check version', false);

  program
    .command('init')
    .option('-s, --skill', 'Generate skill template')
    .option('-f, --force', 'Force the generation, under your own risk!')
    .action((cmd) => pipeSubcommandOutput(child_process.spawn(
      'node', [path.join(__dirname, '../bin/init.js'), ...process.argv.slice(3)],
    )));

  program
    .command('package')
    .option('-i, --input-path <input_path>', 'specify an input path', path.join(process.cwd()))
    .option('-o, --output-path <output_path>', 'specify an output path', path.join(process.cwd(), 'output'))
    .action((cmd) => pipeSubcommandOutput(child_process.spawn(
      'node', [path.join(__dirname, '../bin/packager.js'), ...process.argv.slice(3)],
    )));

  program
    .command('run')
    .requiredOption('-t --task <task>', 'path task, default to cwd')
    .option('-i --input <input>', 'tasks input', {})
    .option('-r --robot <robot>', 'what robot to be used', 'nullrobot')
    .option('-m --mocks <mocks>', 'mocks folder')
    .option('-f --method <method>', 'run method in skill', 'warmup')
    .option('-T --tty <tty>', 'if TTY should be set', true)
    .option('-p --pretty', 'show pretty output', false)
    .action(async (cmd, args) => {
      let isTTY = process.stdin.isTTY && cmd.tty;
      if (cmd.pretty) {
        logger.formatter(process.env.LOGGER_FORMATTER || 'detailed').color(true);
        FLAGS['color'] = true;
        FLAGS['pretty'] = true;
      } else {
        logger.formatter('json').color(false);

        logger.options.preNotify = (log) => {
          // This is ugly, but must be done like this for now until loggin-js allows returning an object
          // This polutes the rpc message with duplicated data
          // An issue has been opened in Loggin'JS forthis to be implements
          log.jsonrpc = '2.0';
          log.method = 'log';
          log.context = task.fqtn;
          log.method = 'log';
          log.params = {
            message: log.message,
            data: log.data,
            level: log.level,
            time: log.time,
            user: log.user,
            channel: log.channel,
          };
        };
        FLAGS['color'] = false;
        FLAGS['pretty'] = false;
      }

      if (cmd.input) {
        try {
          cmd.input = JSON.parse(cmd.input);
        } catch (error) {
          cmd.input = {};
        }
      } else {
        cmd.input = {};
      }

      logger.debug('running command: run');

      let taskPath = cmd.task || cwd;
      let manifest = rallfRunner.getManifest(taskPath);
      if (manifest.error) {
        return logger.error(manifest.error);
      }

      let task;

      try {
        task = rallfRunner.createTask(taskPath, manifest, cmd.robot, cmd.mocks, isTTY);
        let taskLbl = color(task.name + '@' + task.version, 'green');

        logger.debug('Running task:   ' + taskLbl);
        logger.debug('Created task:   ' + taskLbl);
        logger.debug('Executing task: ' + taskLbl);

        // On any event
        task.onAny = (evt, data) => {
          let request = rpiecy.createRequest('event', {
            name: evt,
            content: data || {},
            context: task.fqtn,
            time: now(),
          }, rpiecy.id());
          outputRpc(request);
        };

        /* Handle sigint before readline is active */
        process.once('SIGINT', () =>
          finishHandler(task, cmd, isTTY));

        process.once('close', () =>
          finishHandler(task, cmd, isTTY));

        const methodsAllowed = ['delegate', 'event', 'quit'];
        task.on('routine:end', (params) => {
          if (params.name === 'warmup') {
            logger.debug('Warm up done - listening for requests...');

            if (isTTY == false || isTTY == 'false') {
              setInterval(() => { }, 200000);
            } else {
              /* rpiecy.listen Sets up a readline inteface that listens for json-rpc requests/responses */
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

                    task[method](args)
                      .then((res) => {
                        logger.info("Finshed: ", res);
                        let response = rpiecy.createResponse(request.id, res.return, null);
                        outputRpc(response);
                      })
                      .catch((err) => {
                        let response = rpiecy.createResponse(request.id, null, {
                          code: jsonrpc.INTERNAL_ERROR,
                          data: err,
                          message: 'error running method'
                        });
                        console.log('response', response);
                        outputRpc(response);
                        process.exit(1);
                      });
                  } else if (request.result || request.error) {
                    task.emit('response:' + request.id, request.result);
                  }
                } else if (cmd.verbose) {
                  logger.debug('Received request without id', request);
                }
              });

              /* Handle sigint for readline, as process.on will not receive the event */
              input.once('SIGINT', () => {
                return finishHandler(task, cmd, isTTY);
              });

              input.once('close', () => {
                return finishHandler(task, cmd, isTTY);
              });
            }
          }
        });

        logger.info('running method', { method: cmd.method, task: task.fqtn });
        return await rallfRunner
          .runMethod(task, cmd.method, cmd.input, isTTY)
          .then((resp) => {
            logger.debug(`Received response for ${color(cmd.method, 'blueBright')}(${color(JSON.stringify(cmd.input), 'blackBright')}): ${JSON.stringify(resp.result)}`);
          });
      } catch (error) {
        logger.error(`Finished method ${cmd.method} with ERROR`, { error: error.message });
        if (task) {
          task.devices.quitAll()
            .then(() => process.exit(1));
        }
      }
    });

  let args = program.parse(process.argv);
  if (args.verbose) {
    logger.level('DEBUG');
  } else {
    logger.level('INFO');
  }

  if (!process.argv.slice(2).length) {
    program.help();
    return;
  }
}