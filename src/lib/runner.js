'use strict';

const fs = require('fs-extra');
const path = require('path');
const { Task, Robot } = require('../integration');
const checker = require('./checker');
const examples = require('./examples');
const jsonrpc = require('./jsonrpc');


class Runner {

  constructor() {
    this._taskMap = {};
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
    taskInstance.devices._setDevices(devices || []);
    taskInstance.robot.skills = skills;

    let pipePath = task_path + '/.rallf'
    if (!fs.existsSync(pipePath)) {
      fs.mkdirpSync(pipePath);
      fs.writeFileSync(pipePath + '/event-pipe', '');
    }

    fs.watchFile(pipePath + '/event-pipe', (prev, curr) => {
      if (curr !== prev) {
        let data = fs.readFileSync(pipePath + '/event-pipe').toString().trim();
        if (/^([\w\d]*):([\w\d]*) (.*)$/.test(data)) {
          let parsed = this.parseEvent(data);
          taskInstance.emit(parsed.event_name + ':' + parsed.event_type, parsed.data);
        }
      }
    });
    this._taskMap[taskInstance.getName()] = { instance: taskInstance, robot, manifest, path: task_path, mocks_folder };
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
   * Delegate in a skill
   * @param {Task} task
   * @param {*} skill_name 
   * @param {*} skill_method 
   * @param {*} data 
   * @param {*} options 
   */
  async delegateTaskLocal(task, skill_name, skill_method, data, options) {

    let task_ = this._taskMap[task.getName()];
    // let mock = this.getMock(task_.path, skill_name);
    let manifest = task_.manifest;
    // console.log(mock);

    let hasAccessToSkill = this.checkAccessToSkill(manifest, skill_name, skill_method);
    let skills = task.robot.skills;

    if (!hasAccessToSkill) {
      return Promise.reject({ error: "You havent required access to that skill. Please add to manifest:" + examples.skills });
    }

    if (!skills) {
      return Promise.reject({ error: `Oopsy, mock "${mock.name}" does not export any skills but you are requesting skill (${skill_name})` + examples.skills });
    }

    if (!(skill_name in skills)) {
      return Promise.reject({ error: `Oopsy, skill "${skill_name}" is not exported in mock: ${mock.name}` + examples.skills });
    }

    let skill = skills[skill_name];

    if (!skill.methods) {
      return Promise.reject({ error: `Oopsy, skill "${skill_name}" has no methods exported` + examples.skills });
    }

    if (!(skill_method in skill.methods)) {
      return Promise.reject({ error: `Oopsy, skill method "${skill_method}" is not exported by mock: ${mock.name}` + examples.skills });
    }

    let method = skill.methods[skill_method];
    return Promise.resolve(method.return || 'no-response');
  }

  async delegateTaskRemote(task, task_name, task_method, data, options) {

    let task_ = this._taskMap[await task.getName()];
    let mock = this.getMock(task.mocks_folder || task_.path, task_name);
    let hasAccessToSkill = this.checkAccessToTask(task_.manifest, task_name, task_method);

    if (!hasAccessToSkill) {
      return Promise.reject({ error: "You havent required access to that task. Please add to manifest:" + examples.tasks });
    }

    if (!mock) {
      return Promise.reject({ error: `Oopsy, mock "${task_name}" was not found!` });
    }


    if (!mock.methods) {
      return Promise.reject({ error: `Oopsy, mock "${task_name}" has no methods exported` + examples.tasks });
    }

    if (!(task_method in mock.methods)) {
      return Promise.reject({ error: `Oopsy, mock method "${task_method}" is not exported by mock: ${skill_name}` });
    }


    let method = mock.methods[task_method];
    return Promise.resolve(method.callback());
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

    const subroutines = [];

    const handler = {
      get(target, propKey, receiver) {
        const origMethod = target[propKey];
        let start = Date.now();

        try {
          if (typeof origMethod === 'function') {
            return function (...args) {
              let meth = origMethod.apply(this, args);

              if (meth && meth.then) {
                return meth.then(result => {
                  let end = Date.now();
                  let execTime = (end - start);

                  subroutines.push({
                    method: propKey,
                    args: args,
                    result: result,
                    exec_time: execTime
                  });

                  return result;
                }).catch(err => {
                  throw err;
                });
              }


              return meth;
            };
          }
        } catch (error) {
          throw err;
        }

        return origMethod;
      }
    };

    const taskProxy = new Proxy(task, handler);

    if (!task || task.__proto__.constructor.__proto__.name !== 'Task') {
      throw { error: `Exported class must extend from \"Task\"` };
    }

    if (!checker.hasMethod(task, method_name)) {
      throw { error: `Method (${method_name}) was not found in Skill: ${task.getName()}` };
    }

    // First setup task
    taskProxy.emit('setup:start', {});

    taskProxy.robot.delegateLocal = (...args) => {
      if (!isTTY) {
        return jsonrpc.sendAndAwaitForResponse(jsonrpc.request('delegate-local', args));
      }

      return new Promise((resolve, reject) => {
        this.delegateTaskLocal(taskProxy, ...args)
          .then(resp => resolve(resp))
          .catch(error => reject(error));
      });
    };

    taskProxy.robot.delegateRemote = (...args) => {
      if (!isTTY) {
        return jsonrpc.sendAndAwaitForResponse(jsonrpc.request('delegate-remote', args));
      }

      return new Promise((resolve, reject) => {
        this.delegateTaskRemote(taskProxy, ...args)
          .then(resp => resolve(resp))
          .catch(error => reject(error));
      });
    };

    taskProxy.logger.task_name = task.getName();
    taskProxy.emit('setup:end', {});

    if (taskProxy.warmup && typeof taskProxy.warmup === 'function') {
      task.emit('wamup:start', {});
      await Promise.resolve(taskProxy.warmup());
      task.emit('wamup:end', {});
    }

    // Start
    taskProxy.emit('start', {});
    let result = await taskProxy[method_name](input)
      .then(async result => {
        if (taskProxy.cooldown && typeof taskProxy.cooldown === 'function') {
          await Promise.resolve(taskProxy.cooldown());
        }

        taskProxy.emit('finish', {});

        if (taskProxy.type !== 'skill') {
          await taskProxy.devices.quitAll();
        }

        let execution_time = subroutines.reduce((curr, prev) => ({ exec_time: prev.exec_time + curr.exec_time }), { exec_time: 0 }).exec_time / 1000;
        return { result, execution_time, subroutines };
      }).catch(err => {
        throw err;
      });

    if (task.isSkill()) {
      await new Promise(() => { });
    } else {
      return result;
    }
  }


  async runSkillMethod(task, method, params) {
    return new Promise((resolve, reject) => {
      if (!method in task) {
        reject({ message: 'method-not-exist', code: jsonrpc.METHOD_NOT_FOUND, data: {} });
      }
      else {
        try {
          task[method](params)
            .then(resolve)
            .catch(reject);
        } catch (error) {
          reject(error);
        }

        // let resolvesMethod = task[method](params);
        // if (resolvesMethod.then) {
        //   return resolvesMethod
        //     .then(resolve)
        //     .catch(reject);
        // }
        // return resolvesMethod;
      }
    });
  }
}

module.exports = Runner;