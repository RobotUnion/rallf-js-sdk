#!/usr/bin/env node --no-warnings

const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs');
const wdClient = require('wd');
const IdeLogger = require('../src/Integration/IdeLogger');
const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');

// console.log("Args", argv);

const task_path = argv.task_path || '.';
const robot = argv.robot || '{}';
const input = argv.input || '{}';
const manifest_path = path.resolve(task_path) + '/config/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifest_path).toString());
const mainFile = manifest.main;
const capabilities = manifest.capabilities;
const type = manifest.type;
const isLocal = argv.local;

console.log('Is local: ' + isLocal);

let taskLogger;
taskLogger = new IdeLogger(process);
taskLogger.info('Setting up');


const runner = {
  driver: null,
  task: null,
  finish(status_code = 0) {
    if (this.driver) {
      this.driver.quit().then(
        () => {
          process.stdout.write('finished: with asd code ' + status_code);
          return process.exit(status_code);
        }
      );
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
    // try {
    this.task.setDevice(this.driver);
    this.task.setRobot(runner.getRobot());
    this.task.setInput(runner.getInput());
    let self = this;

    this.task.persist = () => {
      return new Promise((resolve, reject) => {
        let robot = this.task.robot;
        try {
          process.stdout.write('ROBOT:SAVE ' + robot);
          resolve();
        } catch (error) {
          process.stderr.write('error: ' + error);
          reject();
        }
      });
    };

    let prom = this.task.run();

    if (!prom.then) {
      process.stderr.write('error: Task.run must return a promise');
      this.finish(1);
    } else {
      prom.then(resp => {
        process.stdout.write('On run promise');
        setTimeout(() => {
          this.task.finish();
          this.finish(1);
        }, 100);
      }).catch(e => {
        process.stderr.write('On run error promise', error);
        process.stderr.write('error: ' + error);
        this.finish(1);
      });
    }
  }
};

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
  const screen = {
    width: 640,
    height: 480
  };

  let builder = new Builder().forBrowser(capabilities.browserName);

  if (!isLocal || capabilities.browserName === 'firefox' && capabilities.headless) {
    builder.setFirefoxOptions(new firefox.Options().headless().windowSize(screen));
  }
  else if (!isLocal || capabilities.browserName === 'chrome' && capabilities.headless) {
    builder.setFirefoxOptions(new chrome.Options().headless().windowSize(screen));
  }

  builder.build()
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

