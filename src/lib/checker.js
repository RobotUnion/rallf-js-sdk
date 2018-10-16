'use strict';

const fs = require('fs-extra');
const path = require('path');
const Validator = require('jsonschema').Validator;
const schemes = require('./schemes');

const Task = require('../integration/task');

module.exports = {
  /**
   * 
   * @param {string} task_path 
   */
  isValidTaskProject(task_path, manifest) {
    if (typeof task_path !== 'string') {
      throw new Error(`ERROR: "task_path" must be a string`);
    }

    let manifestPath = path.join(task_path, 'config', 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return {
        error: `Task "${task_path}" does not seem to be a rallf Task`
      };
    }


    let validManifest = this.validManifest(manifest);
    if (validManifest.errors) {
      validManifest.errors.forEach(element => {
        throw new Error(`ERROR: Task ${task_path} manifest is invalid: \n ${element.message}`);
      });
    }

    return true;
  },

  /**
   * 
   * @param {any} manifest 
   */
  validManifest(manifest) {
    const v = new Validator();
    const instance = manifest;
    const schema = schemes.manifest;
    let validation = v.validate(instance, schema);

    if (validation.errors) return { valid: false, errors: validation.errors };
    return true;
  },

  checkExportToBeTask(export_, manifest) {
    const isTaskInstance = export_.constructor.prototype.isPrototypeOf(Task);
    if (!isTaskInstance) {
      throw new Error(`ERROR: Exported function in task ${manifest.name} is not extending Task`);
    }
  }
};