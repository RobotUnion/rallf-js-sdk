'use strict';

const dotProp = require('dot-prop');

const dataSymbol = Symbol('_data');
const permissionsSymbol = Symbol('_permissions');

class Robot {
  constructor(task_identifier) {
    this[dataSymbol] = /** @type {Object} */ ({});
    this[permissionsSymbol] = /** @type {Object} */ ({});
    this.task_identifier = /** @type {string} */ (task_identifier);
  }

  /**
   * Get an entry from the robot
   * @param {string} path - path to json entry
   * @returns {any}
   */
  get(path) {
    if (!this.hasPath(path)) throw new Error('Path is not available in this robot');
    if (!this.hasPermission(path, 'read')) throw new Error('You dont have permission to read that path');

    return dotProp.get(this[dataSymbol], path);
  }

  /**
   * Set a value in the robot
   * @param {string} path 
   * @param {any} value 
   */
  set(path, value) {
    if (!this.hasPermission(path, 'read')) throw new Error('You dont have permission to read that path');

    return dotProp.set(this[dataSymbol], path, value);
  }

  /**
   * Does the robot contain that entry
   * @param {string} path 
   * @returns {boolean}
   */
  hasPath(path) {
    return dotProp.has(this[dataSymbol], path);
  }

  /**
   * Does the task have permission for that the path
   * @param {string} path 
   * @param {string} permission 
   * @returns {boolean}
   */
  hasPermission(path, permissionType) {
    let permissions = this[permissionsSymbol];

    if (!/^kb\./.test(path)) {
      path = 'kb.' + path;
    }

    const checkPermStr = (pathStr) => {
      // Check if permission is defined
      if (!(pathStr in permissions)) {
        let rpath = pathStr.replace(/(\.[\w\d]*)$/, '');
        if (rpath != pathStr) return checkPermStr(rpath);
        else return false;
      } else {
        return pathStr;
      }
    }

    let ppath = checkPermStr(path);
    let permission = permissions[ppath];

    if (!permission) return false;

    for (let perm of permission) {
      /* Data can pass either if its set to read, or its set to a task id and set to read */
      if (perm === permissionType || perm.includes(this.task_identifier) && perm.includes(permissionType)) {
        return true;
      }
    }
    return false;
  }
}

module.exports = Robot;

