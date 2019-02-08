'use strict';

const fs = require('fs-extra');
const util = require('util');
const path = require('path');
const {
  Task,
  Robot
} = require('../integration');
const checker = require('./checker');
const examples = require('./examples');
const now = require('./now');

const COOLDOWN_TIMEOUT = process.env.RALLF_COOLDOWN_TIMEOUT || 10 * 60e3;

class Runner {
  constructor() {
    this._taskMap = {};
    this.cooldownTimeout = null;
    this.jsonrpc = require('./jsonrpc');
  }

  /**
   * Create a task for execution
   * @param {string} task_path 
   * @param {any} manifest
   * @param {any} input 
   * @param {string} robot 
   * @param {string} mocks_folder 
   * @param {boolean} isTTY 
   * @returns {Task}
   */
  createTask(task_path, manifest, robot = 'nullrobot', mocks_folder, isTTY) {
    if (!checker.isValidTaskProject(path.resolve(task_path), manifest)) {
      throw new Error(`ERROR: Task "${task_path}" seams to not be a rallf task. Check this for info on how to create tasks: https://github.com/RobotUnion/rallf-js-sdk/wiki/Creating-Tasks#manual`);
    }

    let mainFile = manifest.main;
    let taskPath = path.join(path.resolve(task_path), mainFile);

    if (!fs.existsSync(taskPath)) {
      throw new Error('It seams main file defined in \'config/manifest.json\' does not exist');
    }

    let UserTask = /** @type {Task} */ require(taskPath);
    util.inherits(UserTask, Task);

    checker.checkExportToBeTask(UserTask, manifest);

    let taskInstance = /** @type {UserTask} */ new UserTask();
    taskInstance._manifest = manifest;
    taskInstance.id = manifest.name;
    taskInstance.type = manifest.type;

    let robot_path = path.resolve('./robots/nullrobot');
    if (robot) {
      robot_path = this.locateRobot(robot);
    }

    robot_path = path.resolve(path.join(task_path, robot_path));

    if (!fs.existsSync(robot_path)) {
      this.generateDefaultRobot(robot_path, manifest.fqtn);
    }

    let devices = this.getDevices(robot_path);


    let skills = this.getSkills(robot_path);

    taskInstance.robot = this.getRobot(robot_path + '/data/' + manifest.fqtn || null);

    process.chdir(robot_path + '/data/' + manifest.fqtn);

    taskInstance.devices._setDevices(devices || []);
    taskInstance.robot.skills = skills;

    this._taskMap[taskInstance.name] = {
      instance: taskInstance,
      robot,
      manifest,
      path: task_path,
      mocks_folder
    };

    return taskInstance;
  }

  generateDefaultRobot(path_, fqtn) {
    fs.ensureFileSync(path.join(path_, 'devices.json'));
    fs.writeJsonSync(path.join(path_, 'devices.json'), {});

    fs.ensureFileSync(path.join(path_, 'skills.json'));
    fs.writeJsonSync(path.join(path_, 'skills.json'), {});

    fs.ensureDirSync(path.join(path_, 'data', fqtn));
  }

  /**
   * 
   * @param {string} nameOrPath - name or path 
   */
  locateRobot(nameOrPath) {
    let path_ = nameOrPath;
    if ((/[\\/]/g).test(nameOrPath)) {
      path_ = nameOrPath;
    } else {
      path_ = `robots/${nameOrPath}`;
    }

    return path_;
  }

  getDevices(path_) {
    path_ = path.join(path_, 'devices.json');
    return fs.readJsonSync(path_);
  }

  getSkills(path_) {
    path_ = path.join(path_, 'skills.json');

    return fs.readJsonSync(path_);
  }

  /**
   * @param {string} cwd - robot cwd 
   * @return {Robot}
   */
  getRobot(cwd) {
    if (!fs.existsSync(cwd)) {
      fs.mkdirpSync(cwd);
    }

    return new Robot(cwd);
  }

  /**
   * Get a mock from task
   * @param {string} task_path 
   * @param {string} name 
   */
  getMock(task_path, name) {
    let mockPath = path.join(path.resolve(task_path), 'mocks', name, 'index.js');
    if (fs.existsSync(mockPath)) {
      const mock = require(mockPath);
      mock.name = name;

      return mock;
    }

    return null;
  }

  /**
   * Return the manifest of given task
   * @param {string} task_path - path to the task 
   */
  getManifest(task_path) {
    let validTask = checker.isValidTaskProject(task_path);
    if (validTask.error) {
      return {
        error: validTask.error
      };
    }

    let manifestPath = path.join(task_path, 'config', 'manifest.json');
    const manifest = fs.readJSONSync(manifestPath);

    let validManifest = checker.validManifest(manifest);
    if (validManifest.errors) {
      for (let error of validManifest.errors) {
        return {
          error: `Task ${task_path} manifest is invalid: \n ${error.stack}`
        };
      }
    }

    return manifest;
  }

  /**
   * 
   * @param {Task} task 
   * @param {any} input 
   * @param {boolean} isTTY 
   * @returns {Promise<{result:any, execution_time: number}>}
   */
  async runTask(task, input = {}, isTTY = false) {
    return this.runMethod(task, 'start', input, isTTY);
  }

  /**
   * 
   * @param {Task} task 
   * @param {string} method_name 
   * @param {any} input 
   * @param {boolean} isTTY 
   * @returns {{result: any, execution_time: number, subroutines: any[]}}
   */
  async runMethod(task, method_name, input, isTTY) {

    clearTimeout(this.cooldownTimeout);

    // Check if its a valid task
    checker.checkExportToBeTask(task.constructor);

    // Check if method exists
    if (!checker.hasMethod(task, method_name)) {
      throw {
        error: `Method (${method_name}) was not found in Task: ${task.name}`
      };
    }

    task.robot.delegateLocal = (...args) => this.delegate('local', args[0], args[1], args[2], task);
    task.robot.delegateRemote = (...args) => this.delegate('remote', args[0], args[1], args[2], task);
    task.logger.task_name = task.name;

    if (typeof task.warmup === 'function' && !task._hasDoneWarmup()) {
      task.emit('routine:start', {
        name: 'warmup'
      });

      let timed = await task.warmup();
      task._hasDoneWarmup(true);
      task.emit('routine:end', {
        name: 'warmup',
        data: timed
      });
    }

    if (method_name === 'warmup') {
      return new Promise((res) => {});
    } else {
      task.emit('routine:start', {
        name: method_name
      });

      let result = await task[method_name](input)
        .catch((err) => {
          task.emit('error', err)
        });

      task.emit('routine:end', {
        name: method_name
      });
      return result;
    }
  }

  delegate(routing, target, routine, args, task) {
    return this.sendAndAwaitForResponse(this.jsonrpc.rpiecy
      .createRequest('delegate', {
        routing,
        routine,
        target,
        args
      }, this.jsonrpc.rpiecy.id()), task);
  }

  sendAndAwaitForResponse(request, task) {
    task.logger.info(`Task ${task.id} is listening for: response:` + request.id);

    return request.sendAndAwait()
      .then((resp) => {
        return resp.result;
      })
      .catch(err => {
        return err;
      });
  }
}

module.exports = Runner;