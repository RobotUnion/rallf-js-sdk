'use strict';

const fs = require('fs-extra');
const path = require('path');
const { Task, Robot } = require('../integration');
const checker = require('./checker');


class Runner {

  /**
   * Create a task for execution
   * @param {string} task_path 
   * @param {any} manifest
   * @param {any} input 
   * @param {string} robot_id 
   * @returns {Task}
   */
  createTask(task_path, manifest, input, mock) {
    if (!checker.isValidTaskProject(task_path, manifest)) {
      throw new Error(`ERROR: Task "${task_path}" seams to not be a rallf task.`);
    }

    let mainFile = manifest.main;
    let taskPath = path.join(path.resolve(task_path), mainFile);
    let UserTask = /** @type {Task} */ (require(taskPath));

    checker.checkExportToBeTask(UserTask, manifest);

    let taskInstance = new UserTask();
    taskInstance._manifest = manifest;
    taskInstance.id = manifest.name;
    taskInstance.robot = this.getRobot(mock.robot.cwd || null);
    taskInstance.input = input;

    taskInstance.devices._setDevices(mock.devices || []);

    return taskInstance;
  }


  /**
   * @param {string} cwd - robot cwd 
   * @return {Robot}
   */
  getRobot(cwd) {
    return new Robot(cwd);
  }

  /**
   * Get a mock from task
   * @param {string} task_path 
   * @param {string} name 
   */
  getMock(task_path, name) {
    let mockPath = path.join(path.resolve(task_path), 'mocks', name + '.mock.js');
    if (fs.existsSync(mockPath)) {
      const mock = require(mockPath);
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
      throw new Error(`ERROR: ${validTask.error}`);
    }

    let manifestPath = path.join(task_path, 'config', 'manifest.json');
    const manifest = fs.readJSONSync(manifestPath);

    let validManifest = checker.validManifest(manifest);
    if (validManifest.errors) {
      validManifest.errors.forEach(element => {
        throw new Error(`ERROR: Task ${task_path} manifest is invalid: \n ${element.stack}`);
      });
    }

    return manifest;
  }

  /**
   * 
   * @param {Task} task 
   */
  async runTask(task) {

    if (!task || task.__proto__.constructor.__proto__.name !== 'Task') {
      throw { error: "Exported function must extend from \"Task\"" };
    }

    // First setup task
    task.emit('execution:started', {});

    // Run hooks
    task.emit('setup', {});

    // Start
    task.emit('before-start', {});
    task.emit('start', {});
    let result = await task.start();

    console.log("After run")

    if (task.type !== 'skill') {
      await task.devices.quitAll();
    }

    return result;
  }
}

module.exports = Runner;