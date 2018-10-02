#!/usr/bin/env node --no-warnings

const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs');
const wdClient = require('wd');
const IdeLogger = require('../src/Integration/IdeLogger');
const { Builder, By, until } = require('selenium-webdriver');

// console.log("Args", argv);

const task_path = argv.task_path || '.';
const robot = argv.robot || '{}';
const input = argv.input || '{}';
const manifest_path = path.resolve(task_path) + '/config/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifest_path).toString());
const mainFile = manifest.main;
const capabilities = manifest.capabilities;
const type = manifest.type;

let taskLogger;
taskLogger = new IdeLogger(process);
taskLogger.info('Setting up');


const runner = {
  driver: null,
  task: null,
  finish(status_code = 0) {
    if (this.driver) {
      this.driver.quit(() => {
        process.stdout.write('finished: with asd code ' + status_code);
        process.exit(status_code);
      });
    }
    else {
      process.stdout.write('finished: with code ' + status_code);
      return process.exit(status_code);
    }
  },
  isWeb(task) {
    return task.type.includes('web');
  },
  isAndroid(task) {
    return task.type.includes('android');
  },
  isStandalone(task) {
    return task.type.includes('standalone');
  },
  getRobot() {
    taskLogger.debug('robot: ' + robot);

    return {
      self: {},
      kb: {},
      ...robot
    };
  },
  getInput() {

  },
  run() {
    this.task.onBeforeStart();
    try {
      this.task.setDevice(this.driver);
      this.task.setRobot(runner.getRobot());
      this.task.setInput(runner.getInput());
      let self = this;
      this.task.onFinish = (status_code) => {
        self.finish(status_code);
      };
      taskLogger.debug('running');
      this.task.run();
    } catch (error) {
      process.stderr.write('error: ' + error);
      this.finish(1);
    }
  }
};

// runner.finish(0);

// resolve task path
const taskPath = path.resolve(task_path + '/' + mainFile);

// Remove from cache
delete require.cache[taskPath];

// Import task
const Task = require(taskPath);

// Create task instance
let task = new Task();

task.setLogger(taskLogger);

task.name = manifest.name;
task.type = manifest.type;
task.version = manifest.version;


runner.task = task;

// If its not standalone we need to launch webdriver
if (!runner.isStandalone(task)) {
  // runner.driver = wdClient.remote('localhost', 4444);
  // runner.driver.init(capabilities, (err, sess) => {
  //   taskLogger.debug('init: ' + sess);

  //   if (err) {
  //     runner.driver.quit();
  //     process.stderr.write('error: ' + err);
  //     return process.exit(1);
  //   }

  //   runner.run();
  // });
  new Builder()
    .forBrowser('firefox')
    .build()
    .then(driver => {
      runner.driver = driver;
      runner.run();
    })
    .catch(e => {
      if (e) {
        runner.driver.quit();
        process.stderr.write('error: ' + e);
        return process.exit(1);
      }
    });
} else {
  runner.run();
}

