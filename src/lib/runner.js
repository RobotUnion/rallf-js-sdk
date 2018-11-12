'use strict';

const fs = require('fs-extra');
const path = require('path');
const { Task, Robot } = require('../integration');
const checker = require('./checker');
const examples = require('./examples');

const COOLDOWN_TIMEOUT = process.env.RALLF_COOLDOWN_TIMEOUT || 10 * 60e3; // 10 minutes

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
  createTask(task_path, manifest, robot, mocks_folder, isTTY) {
    if (!checker.isValidTaskProject(task_path, manifest)) {
      throw new Error(`ERROR: Task "${task_path}" seams to not be a rallf task. Check this for info on how to create tasks: https://github.com/RobotUnion/rallf-js-sdk/wiki/Creating-Tasks#manual`);
    }
    // console.log(task_path, path.resolve(task_path));


    let mainFile = manifest.main;
    let taskPath = path.join(path.resolve(task_path), mainFile);


    if (!fs.existsSync(taskPath)) {
      throw new Error(`It seams main file defined in 'config/manifest.json' does not exist`);
    }

    let UserTask = /** @type {Task} */ (require(taskPath));

    checker.checkExportToBeTask(UserTask, manifest);

    let taskInstance = /** @type {UserTask} */ new UserTask();
    taskInstance._manifest = manifest;
    taskInstance.id = manifest.name;
    taskInstance.type = manifest.type;

    let robot_path = this.locateRobot(robot);
    if (!robot) {
      robot_path = '/robots/nullrobot';
    }

    robot_path = task_path + robot_path;

    if (!fs.existsSync(robot_path)) {
      this.generateDefaultRobot(robot_path, manifest.fqtn);
    }

    let devices = this.getDevices(robot_path);

    let skills = this.getSkills(robot_path);

    taskInstance.robot = this.getRobot((robot_path + '/data/' + manifest.fqtn) || null);

    process.chdir((robot_path + '/data/' + manifest.fqtn));

    taskInstance.devices._setDevices(devices || []);
    taskInstance.robot.skills = skills;

    this._taskMap[taskInstance.name] = { instance: taskInstance, robot, manifest, path: task_path, mocks_folder };
    return taskInstance;
  }

  generateDefaultRobot(path_, fqtn) {
    fs.ensureFileSync(path.join(path_, 'devices.json'));
    fs.writeJsonSync(path.join(path_, 'devices.json'), {});

    fs.ensureFileSync(path.join(path_, 'skills.json'));
    fs.writeJsonSync(path.join(path_, 'skills.json'), {});

    fs.ensureDirSync(path.join(path_, 'data', fqtn));
  }

  safeJSONParse(str) {
    let parsed;
    try {
      parsed = JSON.parse(str);
    } catch (e) {
      parsed = JSON.parse(JSON.stringify(str));
    }
    return parsed;
  }

  /**
   * 
   * @param {string} nameOrPath - name or path 
   */
  locateRobot(nameOrPath) {
    let path_ = nameOrPath;
    if (/[\\/]/g.test(nameOrPath)) {
      path_ = nameOrPath;
    } else {
      path_ = `/robots/${nameOrPath}`;
    }
    return path_;
  }

  getDevices(path_) {
    path_ = path.join(path_, 'devices.json');
    let devices = fs.readJsonSync(path_);
    return devices;
  }

  getSkills(path_) {
    path_ = path.join(path_, 'skills.json');
    let skills = fs.readJsonSync(path_);
    return skills;
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
      return { error: validTask.error };
    }

    let manifestPath = path.join(task_path, 'config', 'manifest.json');
    const manifest = fs.readJSONSync(manifestPath);

    let validManifest = checker.validManifest(manifest);
    if (validManifest.errors) {
      for (let error of validManifest.errors) {
        return { error: `Task ${task_path} manifest is invalid: \n ${error.stack}` };
      }
    }

    return manifest;
  }


  checkAccessToSkill(manifest, skill_name, skill_method) {
    if (
      manifest.skills
      && manifest.skills[skill_name]
      && manifest.skills[skill_name].indexOf(skill_method) !== -1
    ) return true;
    return false;
  }

  checkAccessToTask(manifest, task_name, task_method) {
    if (
      manifest.tasks
      && manifest.tasks[task_name]
      && manifest.tasks[task_name].indexOf(task_method) !== -1
    ) return true;
    return false;
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
    const subroutines = [];

    // Task instance must extend from Task
    if (!task || task.__proto__.constructor.__proto__.name !== 'Task') {
      throw { error: `Exported class must extend from \"Task\"` };
    }

    if (!checker.hasMethod(task, method_name)) {
      throw { error: `Method (${method_name}) was not found in Task: ${task.name}` };
    }

    task.emit('setup:start', {});

    task.robot.delegateLocal = (...args) => {
      return this.sendAndAwaitForResponse(this.jsonrpc.rpiecy.createRequest('delegate-local', args, this.jsonrpc.rpiecy.id()), task);
    };

    task.robot.delegateRemote = (...args) => {
      return this.sendAndAwaitForResponse(this.jsonrpc.rpiecy.createRequest('delegate-remote', args, this.jsonrpc.rpiecy.id()), task);
    };

    task.logger.task_name = task.name;
    task.emit('setup:end', {});


    if (typeof task.warmup === 'function' && !task._hasDoneWarmup()) {
      task.emit('warmup:start', {});
      await Promise.resolve(task.warmup());
      task._hasDoneWarmup(true);
      task.emit('warmup:end', {});

      this.cooldownTimeout = setTimeout(async () => {
        try {
          if (task.cooldown && typeof task.cooldown === 'function') {
            await Promise.resolve(task.cooldown());
          }

          if (task.type !== 'skill') {
            await task.devices.quitAll();
          }

          task.emit('finish', {});
        } catch (error) {
          task.logger.error('There has been an error cooling down: ' + error.stack);
          task.emit('error', { error });
        }
      }, COOLDOWN_TIMEOUT);
    }

    if (method_name === 'warmup') {
      return new Promise(res => { });
    } else {
      task.emit('run-method', { method_name, input });
      return await task[method_name](input)
        .then(result => {
          let execution_time = subroutines.reduce((curr, prev) => ({ exec_time: prev.exec_time + curr.exec_time }), { exec_time: 0 }).exec_time / 1000;
          return { result, execution_time, subroutines };
        }).catch(err => {
          task.emit('error', err);
        });
    }
  }

  sendAndAwaitForResponse(request, task) {
      task.logger.info(`Task ${task.id} is listening for: ` + 'response:' + request.id);
    return request.sendAndAwait().then(resp => resp.result);
  }


  async runSkillMethod(task, method, params) {
    return new Promise((resolve, reject) => {
      if (!method in task) {
        reject({ message: 'method-not-exist', code: this.jsonrpc.METHOD_NOT_FOUND, data: {} });
      }
      else {
        try {
          task[method](params)
            .then(resolve)
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      }
    });
  }
}

module.exports = Runner;