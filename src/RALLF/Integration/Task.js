const Runnable = require('./Runnable');
class Task {
  constructor(logger) {
    this.logger = logger;
    this.device;
    this.robot;
    this.input;
  }

  run() { }
  mock() { }
  onFinish() { }


  finish() {
    this.onFinish()
  }

  setDevice(device) { this.device = device }
  setRobot(robot) { this.robot = robot }
  setInput(input) { this.input = input }
  setLogger(logger) { this.logger = logger }
}
module.exports = Task