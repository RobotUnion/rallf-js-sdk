// const Runnable = require('./Runnable');

class Task {
  constructor(logger) {
    this.logger = logger;
    this.device = {
      init: (device) => { }
    };
    this.robot;
    this.input;
    this.persisting = false;
  }


  run() { }

  mock() { }

  onFinish(x) { }

  onBeforeStart(x) { }

  finish(x) {
    this.onFinish(x)
  }

  /**
   * @param {string} task_identifier         - can be the name or the id 
   * @param {*} method                       - method to run
   * @param {*} data                         - data to send to method
   * @param {Object} options                 - Additional options
   * @param {boolean} options.auto_terminate - if task should be terminated on delegateFinish
   * 
   */
  delegate(task_identifier, method, data, options) {
    return Promise.reject('Oopsy, it seems like delegate is not setup for this task');
  }

  /**
   * Checks and saves robot
   * @return {Promise<any>}
   */
  persist() {

  }
}

module.exports = Task