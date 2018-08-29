#!/usr/bin/env node

const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs');
const wdClient = require('wd');
const IdeLogger = require('../src/Integration/IdeLogger');

console.log("Args", argv);

if (!argv.task_path || !argv.manifest_path) {
  console.log('  ERROR: Args are required.');
  console.log(`  Usage: ${argv['$0']} --task_path=<path> --manifest_path=<path>`);
  process.stderr.write('Finished: error');
  return 1;
}

const task_path = argv.task_path;
const manifest_path = argv.manifest_path;
const manifest = JSON.parse(fs.readFileSync(manifest_path).toString());
const robot = '{}';
const input = '{}';
const mainFile = manifest.main;
const capabilities = manifest.capabilities;
const driver = wdClient.remote('localhost', 4444);
const taskPath = path.resolve(task_path + '/' + mainFile);
delete require.cache[taskPath];


console.log('manifest', manifest);

driver.on('error', (error) => {
  console.log('ERROR Driver: ', error);
});

let Task;
console.log('loading from: ', path.join(task_path, mainFile));
try {
  Task = require(path.join(task_path, mainFile));

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