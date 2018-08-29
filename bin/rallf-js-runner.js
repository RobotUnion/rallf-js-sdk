#!/usr/bin/env node

const argv = require('yargs').argv;
const path = require('path');
const wdClient = require('wd');
const IdeLogger = require('../src/Integration/IdeLogger');

if (!argv.task_path || !argv.manifest) {
  console.log('  ERROR: Args are required.');
  console.log(`  Usage: ${argv['$0']} --task_path=<path> --manifest=<manifest_json>`);
  return 1;
}

const manifest = JSON.parse(argv.manifest);
const task_path = argv.task_path;
const robot = argv.robot || '{}';
const input = argv.input || '{}';
const mainFile = manifest.main;
const capabilities = manifest.capabilities;
const driver = wdClient.remote('localhost', 4444);
const taskPath = path.resolve(task_path + '/' + mainFile);
delete require.cache[taskPath];


console.log(manifest);

driver.on('error', (error) => {
  console.log('ERROR Driver: ', error);
});

let Task;
try {
  Task = require(task_path + '/' + mainFile);

  let taskLogger;
  taskLogger = new IdeLogger(process);
  taskLogger.info('Setting up');

  let task = new Task();
  task.name = manifest.name;

  driver.init(capabilities, (err, sess) => {
    taskLogger.debug('init: ' + sess);
    if (err) {
      driver.quit();
      process.stderr.write('error: ' + err);
      return process.exit(1);
    }
    task.setDevice(driver);
    task.setLogger(taskLogger);
    task.setRobot(JSON.parse(robot));
    task.setInput(JSON.parse(input));

    task.onFinish = function (x) {
      driver.quit(() => {
        process.stdout.write('finished: ' + x);
        return process.exit(0);
      });
    };
    taskLogger.debug('running');
    task.run();
  });
} catch (error) {
  driver.quit();
  process.stderr.write('error: ' + JSON.stringify(error));
  return process.exit(1);
}