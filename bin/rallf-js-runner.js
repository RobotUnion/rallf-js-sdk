#!/usr/bin/env node

const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs');
const wdClient = require('wd');
const IdeLogger = require('../src/Integration/IdeLogger');

console.log("Args", argv);


if (!argv.task_path) {
  argv.task_path = process.cwd();
}

if (!argv.manifest_path) {
  argv.manifest_path = path.join(process.cwd(), 'config', 'manifest.json');
}

if (!argv.task_path || !argv.manifest_path) {
  console.log('  ERROR: Args are required.');
  console.log(`  Usage: ${argv['$0']} --task_path=<path> --manifest_path=<path>`);
  process.stderr.write('Finished: error');
  return 1;
}


let task_path = path.resolve(argv.task_path);
let manifest_path = path.resolve(argv.manifest_path);
let manifest = JSON.parse(fs.readFileSync(manifest_path).toString());
const robot = '{}';
const input = '{}';
const mainFile = manifest.main;
const capabilities = manifest.capabilities;
const driver = wdClient.remote('localhost', 4444);
const taskPath = path.resolve(task_path + '/' + mainFile);
delete require.cache[taskPath];


let Task;
try {
  Task = require(path.join(task_path, mainFile));

  let taskLogger;
  taskLogger = new IdeLogger(process);
  taskLogger.info('Setting up');

  let task = new Task();
  task.name = manifest.name;

  driver.init(capabilities, (err, sess) => {
    // taskLogger.debug('init: ' + sess);
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
      driver.quit();
      process.stdout.write('finished: ' + JSON.stringify(x));
      return process.exit(0);
    };
    task.run();
  });
} catch (error) {
  driver.quit();
  if (error.toString().includes('ECONNREFUSED')) {
    process.stderr.write('\nerror: Seem like you cant connect, please try again or contact us');
  }
  else if (!error.includes('DeprecationWarning:')) {
    process.stderr.write('\nerror: ' + JSON.stringify(error));
  }
  return process.exit(1);
}