// const Runnable = require('./Runnable');

class Task {
  constructor(logger) {
    this.logger = logger;
    this.device;
    this.robot;
    this.input;
  }


  run() { }

  mock() { }

  onFinish(x) { }
  
  onBeforeStart(x) {}

  finish(x) {
    this.onFinish(x)
  }


  /**
   * @method setDevice
   * @param { JSON } device 
   */
  setDevice(device) { this.device = device }

  /**
   * @method setRobot
   * @param { JSON } robot 
   */
  setRobot(robot) { this.robot = robot }

  /**
   * @method setInput
   * @param { JSON } input 
   */
  setInput(input) { this.input = input }

  /**
   * @method setLogger
   * @param { RallfLogger | ConsoleLogger } logger 
   */
  setLogger(logger) { this.logger = logger }
}

module.exports = Task