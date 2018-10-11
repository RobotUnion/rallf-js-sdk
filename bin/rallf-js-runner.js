#!/usr/bin/env node --no-warnings

/**
 * Rallf JS SDK runner - development
 */

const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs-extra');
const wdClient = require('wd');
const clc = require('./clc');
const IdeLogger = require('../src/Integration/IdeLogger');
const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');
const { addedDiff } = require('deep-object-diff');

const task_path = argv.task_path || '.';
const input = argv.input || '{}';
const manifest_path = path.resolve(task_path) + '/config/manifest.json';
let manifest = JSON.parse(fs.readFileSync(manifest_path).toString());
const mainFile = manifest.main;
const capabilities = manifest.capabilities;
const type = manifest.type;
const isLocal = argv.local;

const defaultRobot = {
  kb: {
    version: '1.0.0',
    id: null,
    self: {
      alias: null,
      public: null,
    }
  },
  permissions: {
    'kb.version': ["read"],
    'kb.id': ["read"],
    'kb.self.alias': ["read"],
    'kb.self.public': ["none"],
  },
  accesses: {}
};

let robotName = argv.robot || 'new';

let taskLogger;
taskLogger = new IdeLogger(process, true);
taskLogger.info('Setting up');


// Returns all paths from an object
function getPathsFromObject(obj) {
  let paths = [];
  for (let key in obj) {
    let val = obj[key];
    if (typeof val === 'object') {
      let subPaths = getPathsFromObject(val);
      subPaths.forEach(e => {
        paths.push({
          key: [key, e.key].join('.'),
          val: e.val
        })
      })
    } else {
      let path = { key, val };
      paths.push(path);
    }
  }
  return paths;
}

function setDescendantProp(object, path, value) {
  let a = path.split('.');
  let o = object;
  for (let i = 0; i < a.length - 1; i++) {
    let n = a[i];
    if (n in o) {
      o = o[n];
    } else {
      o[n] = {};
      o = o[n];
    }
  }

  // console.log('Saving value: ' + path + ' as:', value);
  o[a[a.length - 1]] = value;
  // console.log('Saving value: ', o);
}

function getDescendantProp(obj, path) {
  let arr = path.split('.');
  while (arr.length && (obj = obj[arr.shift()]));
  return obj;
}


const runner = {
  driver: {
    generateOptions(browser, task_identifier) {
      let opts;
      let browserName = browser.name;

      if (browserName === 'firefox') {
        opts = new firefox.Options();
      }
      else if (browserName === 'chrome') {
        opts = new chrome.Options();
      }

      if (browser.headless === true) {
        opts.headless();
      }

      if (browser.screen) {
        opts.windowSize(browser.screen);
      }

      if (browser.profile) {
        let robot = runner.getRobot();
        let profiles = robot.kb.profiles;
        // let permission = robot.permissions;
        if (browser.profile == '@bot') {
          browser.profile = 'default';
        }

        let profile = profiles ? profiles[browserName] : null;

        if (profile && runner.hasPermission('profiles.' + browserName, robot), task_identifier, 'read') {
          opts.setProfile(profile);
        }
      }
      return opts;
    },
    async get(task, manifest, browserName = 'firefox') {
      let capabilities = manifest.capabilities;
      let devices = manifest.devices;

      // console.log("Manifest: ", manifest, devices);

      if (!runner.isStandalone(manifest)) {
        let deviceAvailable = devices && devices.length && devices.some(el => el.name === browserName);
        if (!deviceAvailable) {
          process.stderr.write('error: Browser ' + browserName + ' is not available\n');
          return process.exit(1);
        }

        let browser = devices.find(el => el.name === browserName);

        // console.log("device is available: ", browserName, browser);

        let builder = new Builder().forBrowser(browser.name);
        // console.log("capabilities;: ", browser, 'isLocal: ' + isLocal);

        let opts = this.generateOptions(browser, task.constructor.name);

        if (browser.name === 'firefox') {
          builder.setFirefoxOptions(opts);
        }
        else if (browser.name === 'chrome') {
          builder.setChromeOptions(opts);
        }

        return await builder.build()
          .then(driver => task.device = driver)
          .catch(e => {
            if (e) {
              process.stderr.write('error: ' + e + '\n');
              return process.exit(1);
            }
          });
      }
    }
  },
  task: null,
  persisting: false,
  manifestMap: {
    main: manifest
  },
  taskMap: {},
  robotMap: {},

  /* call task lifecycle hook securely */
  callLifecycleHook(name, ...args) {
    let lch = this.task[name];
    if (this.task && typeof lch === 'function') {
      return lch.bind(this.task)(...args);
    }
  },

  finish(msg, task) {
    if (!task.persisting) {
      let pipePath = path.resolve(task_path) + '/event-pipe';
      if (fs.existsSync(pipePath)) {
        fs.unlinkSync(pipePath);
      }
      if (task.device.quit) {
        task.device.quit().then(
          () => {
            process.stdout.write(clc.info('INF') + ' Finished with data: ' + JSON.stringify(msg) + '\n');
            return process.exit(msg);
          }
        );
      }
      else {
        process.stdout.write(clc.info('INF') + ' Finished with data: ' + JSON.stringify(msg) + '\n');
        return process.exit(msg);
      }
    }
  },

  isWeb(task) {
    return task.type.includes('web');
  },

  isAndroid(task) {
    return task.type.includes('android');
  },

  isStandalone(task) {
    return task.devices.length <= 0;
  },

  getRobot() {
    // taskLogger.debug('robot: ' + robot);
    let robotData = {};
    let robotPath = null;
    if (robotName === 'new') {
      robotName = argv.robot_name || Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
      console.log(clc.warning('WAR') + " No robot passed, creating new one: " + robotName);

      robotPath = path.resolve('./robots/' + robotName);
      console.log(clc.info('INF') + " If you want to edit the robot you can do so by editing the files at: " + robotPath);

      fs.mkdirpSync(robotPath);
      fs.writeFileSync(robotPath + '/kb.json', JSON.stringify({ ...defaultRobot.kb, id: robotName }));
      fs.writeFileSync(robotPath + '/permissions.json', JSON.stringify(defaultRobot.permissions));
      fs.mkdirpSync(robotPath + '/data');
    }


    robotPath = path.resolve('./robots/' + robotName);
    if (fs.existsSync(robotPath)) {
      let kb = JSON.parse(fs.readFileSync(robotPath + '/kb.json'));
      let perm = JSON.parse(fs.readFileSync(robotPath + '/permissions.json'));

      robotData = {
        permissions: perm,
        kb: kb
      };
    } else {
      console.log(clc.error('ERR') + " Oopsy, cant find robot: " + robotName);
      console.log(clc.info('INF') + " If you want to create a robot you can do so by passing: " + clc.lgray('--robot=new --name=<name>'));
      process.exit(1);
    }

    return this.robotMap[robotName] = {
      name: robotName,
      ...defaultRobot,
      ...robotData
    };
  },
  getInput() {
    return JSON.parse(input) || {};
  },
  safeJSONParse(str) {
    let parsed;
    try {
      parsed = JSON.parse(str);
    } catch (e) {
      parsed = JSON.parse(JSON.stringify(str));
    }
    return parsed;
  },
  parseEvent(evtString) {
    let [x, name, data] = evtString.match(/^event:(\w*) (.*)/);
    return {
      data: this.safeJSONParse(data),
      name: name
    }
  },
  getManifest(task_path) {
    const manifest_path = path.resolve(task_path) + '/config/manifest.json';
    const manifest = JSON.parse(fs.readFileSync(manifest_path).toString());
    return manifest;
  },
  hasPermission(key, robot, task_identifier, permissionType = 'read') {
    let permissions = robot.permissions;

    if (!/^kb\./.test(key)) {
      key = 'kb.' + key;
    }

    const checkPermStr = (keyStr) => {
      // Check if permission is defined
      // console.log("Checinkg: " + keyStr);
      if (!(keyStr in permissions)) {
        let rkey = keyStr.replace(/(\.[\w\d]*)$/, '');
        if (rkey != keyStr) return checkPermStr(rkey);
        else return false;
      } else {
        return keyStr;
      }
    }

    let pkey = checkPermStr(key);
    let permission = permissions[pkey];
    // console.log('Get permission: ' + key, permissions);

    if (!permission) return false;

    for (let perm of permission) {
      /* Data can pass either if its set to read, or its set to a task id and set to read */
      if (perm === permissionType || perm.includes(task_identifier) && perm.includes(permissionType)) {
        // console.log('Has permission to read: ' + key);
        return true;
      }
    }
    return false;
  },

  /**
   * Filters just accessible data
   * @param {*} robot           - object containing all robot info
   * @param {*} task_identifier - the id of current task
   */
  filterRobotData(robot, task_identifier) {
    let data = { kb: {} };
    let { permissions, kb } = robot;
    let paths = getPathsFromObject(kb);

    paths.forEach(path => {
      if (this.hasPermission(path.key, robot, task_identifier, 'read')) {
        setDescendantProp(data.kb, path.key, path.val);
      }
    });
    return data;
  },

  delegateTask(task_identifier, method, data) {
    // console.log('delegateTask: ', task_identifier, method);
    return new Promise((resolve, reject) => {
      // This should run method in task if it has permissions
      let projPath = process.env.HOME + '/RallfProjects';
      if (!fs.existsSync(projPath + '/' + task_identifier)) {
        // console.log('!exists: ', projPath + '/' + task_identifier);
        reject('That task does not exist: ' + task_identifier);
      }

      if (!fs.existsSync(projPath + '/' + task_identifier + '/config/manifest.json')) {
        reject('That task has no manifest: ' + task_identifier);
      }

      let mani = this.manifestMap[task_identifier] = this.getManifest(projPath + '/' + task_identifier);

      let ress = runner.run(projPath + '/' + task_identifier, mani.main, method, data)

      // console.log('ress: ' + ress);
      ress.then((data) => {
        // console.log('data: ' + data);
        resolve();
      }).catch((err) => {
        // console.log('err: ', new Error(err));
        this.finish(new Error(err), this.taskMap[task_identifier]);
      });
    });
  },

  persistRobot(robot, task) {

    let originalRobot = this.robotMap[robot.kb.id];
    let diference = addedDiff(originalRobot.kb, robot.kb);

    // console.log("Original: ", originalRobot.kb);
    // console.log("robot: ", robot.kb);
    // console.log("Diference: ", diference);
    if (Object.keys(diference).length) {
      let paths = getPathsFromObject(diference);
      let data = {
        ...originalRobot.kb
      };

      for (let path of paths) {
        let hasPerm = runner.hasPermission('kb.' + path.key, originalRobot, task.constructor.name, 'write');

        if (!hasPerm) {
          process.stderr.write(clc.info('ERR') + ' Dont have permissions to save entry: ' + path.key + '\n');
          return process.exit(1);
        } else {
          setDescendantProp(data, path.key, path.val);
        }
      }

      let kbPath = path.resolve('./robots/' + robot.kb.id + '/kb.json');

      fs.writeFileSync(kbPath, JSON.stringify(data));
    }
  },

  setUpTask(task_path, mainFile) {
    // resolve task path
    const taskPath = path.resolve(task_path + '/' + mainFile);
    // console.log('TaskPath: ' + taskPath)

    // Remove from cache
    try {
      delete require.cache[taskPath];
    } catch (error) { }

    // Import task
    const Task = require(taskPath);
    let task;

    // console.log('Task map: ', this.taskMap);

    if (!this.taskMap[Task.name]) {
      // console.log('Task is not cached', Task.name);

      // Create task instance
      task = new Task();

      this.taskMap[Task.name] = task;

      // console.log("Task.name", Task.name);
      // console.log("Task.name", this.taskMap);

      manifest = this.manifestMap[Task.name] || this.manifestMap.main;

      task.logger = taskLogger;
      task.name = manifest.name;
      task.type = manifest.type;
      task.version = manifest.version;

      runner.task = task;

      // this.task.onBeforeStart();
      this.callLifecycleHook('onBeforeStart');
      task.device = {};
      task.device.get = async (browserName) => await this.driver.get(task, manifest, browserName);
      task.robot = runner.filterRobotData(runner.getRobot(), Task.name);
      task.input = runner.getInput();
      let self = this;
      let pipePath = path.resolve(task_path) + '/event-pipe';


      // Create pipe if not created
      if (!fs.existsSync(pipePath)) {
        fs.writeFileSync(pipePath, '');
      }

      // Used for inwards events
      fs.watchFile(pipePath, (curr, prev) => {
        if (fs.existsSync(pipePath)) {
          let data = fs.readFileSync(pipePath).toString();
          if (data.includes('event:')) {
            this.callLifecycleHook('onEvent', this.parseEvent(data));
          }
        }
      });


      task.persist = () => {
        task.persisting = true;
        return new Promise((resolve, reject) => {
          try {
            this.persistRobot(task.robot, task);
            task.persisting = false;
            resolve('Done');
          } catch (error) {
            reject(error);
          }
          // try {
          //   // Send ROBOT:SAVE event
          //   process.stdout.write('ROBOT:SAVE ' + JSON.stringify(robot));

          //   // Set an event listener for 'data' 
          //   // If it contains 'persist-finished' we can resolve the promise
          //   process.stdin.on('data', (data) => {
          //     if (data.includes('persist-finished')) {
          //       fs.unwatchFile(pipePath);
          //       task.persisting = false;
          //       resolve();
          //     }
          //   });
          // } catch (error) {
          //   process.stderr.write('error: ' + error + '\n');
          //   task.persisting = false;
          //   this.finish(error, task);
          // }
        });
      };

      task.infinite = () => {
        return new Promise((resolve, reject) => { });
      };

      task.delegate = async (task_identifier, method, data) => {
        // console.log('Task:     ', task_identifier);
        // console.log('Method:   ', method);
        // console.log('Manifest: ', manifest.permissions.tasks);
        manifest = this.manifestMap[Task.name] || this.manifestMap.main;

        /* Check if main task has defined permission to the delegated task */
        if (!(task_identifier in manifest.permissions.tasks)) {
          return Promise.reject('Permission for task is not defined in manifest.');
        }

        // console.log('Methods: ', manifest.permissions.tasks[task_identifier]);
        // console.log('Index: ' + manifest.permissions.tasks[task_identifier].indexOf(method));

        /* Check if it has requested access to that method */
        if (manifest.permissions.tasks[task_identifier].indexOf(method) === -1) {
          return Promise.reject('You havent required access to those methods.');
        }

        /* Check if robot allows delegating to task */
        let robotPerm = this.getRobot().permissions;
        let permKey = `accesses.tasks.${task_identifier}`;

        // console.log('robotPerm: ', robotPerm);
        // console.log('permKey: ', permKey);
        if (!(permKey in robotPerm)) {
          return Promise.reject('This robot does not allow accesing task ' + task_identifier);
        }

        /* If everything is okey we can proceed to run that method */
        return this.delegateTask(task_identifier, method, data);
      };

      task.quit = () => {
        this.callLifecycleHook('onFinish');
        this.finish(0, task);
      };
    } else {
      // console.log('Task is cached', Task.name);
      task = this.taskMap[Task.name];
    }
    return task;
  },

  async run(task_path, mainFile, method, method_data) {
    let task = await this.setUpTask(task_path, mainFile);

    let prom;
    if (method) {
      if (typeof task[method] === 'function') {
        // console.log('Running method: ' + method);
        return new Promise((resolve, reject) => {
          task[method](method_data)
            .then(resp => { resolve(resp) })
            .catch(err => { reject(err.stack) });
        });
      }
    }

    if (manifest.type !== 'lib') prom = task.run();

    // Promise will run hen task finishes or fails
    if (prom && prom.then) {
      prom.then(resp => {
        setTimeout(() => {
          this.callLifecycleHook('onFinish');
          this.finish(resp, task);
        }, 100);
      }).catch(err => {
        this.persisting = false;
        process.stderr.write('error: ' + err.stack + '\n');
        this.finish(err, task);
      });
    }
  }
};

runner.run(task_path, mainFile);