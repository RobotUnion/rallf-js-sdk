'use strict';

const Logger = require('./logger');
const Devices = require('./devices');
const Robot = require('./robot');
const PubSub = require('../lib/pubsub');

/**
 * This is the class the user will need to extend from to create a Task
 */
class Task extends PubSub {
  constructor() {
    super();

    this.logger = /** @type {Logger} */ (new Logger(process, true));
    this.devices = /** @type {Devices} */ (new Devices());
    this.robot =  /** @param {Robot|null} */ (null);
    this.input =  /** @param {any|null} */ (null);
    this._persisting =  /** @param {Boolean} */ (false);
    this._manifest =  /** @param {Manifest|null} */ (null);
    this.id = null;
  }

  /**
   * Start method of the task.
   * This is the one that will be called when running.
   * @return {Promise<any>}
   */
  start() {
    return Promise.resolve('Task has not implemented start method');
  }

  /**
   * @return {String|null}
   */
  getName() {
    return this._manifest ? this._manifest.name : null;
  }

  /**
   * @return {String|null}
   */
  getVersion() {
    return this._manifest ? this._manifest.version : null;
  }

  /**
   * Delegate a task locally
   * @param {string} task_identifier         - can be the name or the id 
   * @param {*} method                       - method to run
   * @param {*} data                         - data to send to method
   * @param {Object} options                 - Additional options
   * @param {boolean} options.auto_terminate - if task should be terminated on delegateFinish
   * @returns {Promise<any>}
   */
  delegateLocal(task_identifier, method, data, options) {
    return Promise.reject('Oopsy, it seems like delegate is not setup for this task');
  }


  /**
   * Delegate a task in other incubator
   * @param {string} task_identifier         - can be the name or the id 
   * @param {*} method                       - method to run
   * @param {*} data                         - data to send to method
   * @param {Object} options                 - Additional options
   * @param {boolean} options.auto_terminate - if task should be terminated on delegateFinish
   * @returns {Promise<any>}
   */
  delegateExternal(task_identifier, method, data, options) {
    return Promise.reject('Oopsy, it seems like delegate is not setup for this task');
  }
}

module.exports = Task;