'use strict';

const dotProp = require('dot-prop');

const dataSymbol = Symbol('_data');
const permissionsSymbol = Symbol('_permissions');

const fs = require('fs-extra');
const path = require('path');

class Robot {
  constructor(cwd) {
    this._cwd = path.resolve(cwd) || null;
  }

  /**
   * Save a JSON object to a file
   * @param {string} filepath 
   * @param {object} data 
   */
  saveJSON(filepath, data) {
    if (!fs.existsSync(this._cwd)) {
      throw new Error('Oopsy, the robot cwd does not exist: ' + this._cwd);
    }

    filepath = path.join(this._cwd, filepath);
    fs.writeJsonSync(filepath, data);
  }

  /**
   * Read JSON from file
   * @param {string} filepath
   * @return {object} 
  */
  readJSON(filepath) {
    if (!fs.existsSync(this._cwd)) {
      throw new Error('Oopsy, the robot cwd does not exist: ' + this._cwd);
    }

    filepath = path.join(this._cwd, filepath);
    return fs.readJsonSync(filepath);
  }

  /**
   * Check if a file or directory exists synchronously
   * @param {string} filepath 
   */
  existsSync(filepath) {
    filepath = path.join(this._cwd, filepath);
    return fs.existsSync(filepath);
  }

  /**
   * Check if a file or directory exists asynchronously
   * @param {string} filepath 
   * @param {function (boolean)} callback
   */
  exists(filepath, callback) {
    filepath = path.join(this._cwd, filepath);
    return fs.exists(filepath, callback);
  }
}

module.exports = Robot;

