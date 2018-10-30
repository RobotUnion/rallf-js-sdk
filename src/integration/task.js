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
    this.robot =  /** @param {Robot} */ (new Robot());
    this._persisting =  /** @param {Boolean} */ (false);
    this._manifest =  /** @param {Manifest|null} */ (null);
    this.id = null;
    this.type = 'task';
  }

  isSkill() {
    return this.type === 'skill';
  }


  isTask() {
    return this.type === 'task';
  }

  /**
   * Start method of the task.
   * This is the one that will be called when running.
   * @param {any} input - this is the input of your task, provided by the consumer
   * @return {Promise<any>}
   */
  start(input) {
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

}

module.exports = Task;