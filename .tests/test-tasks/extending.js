const rallf = require('../../index');

class NotExtendedTask {
  constructor() {}
}

class OnceExtendedTask extends rallf.Task {
  constructor() {
    super();
  }

  async start() {
    return 'worked';
  }
}

class DoubleExtendedTask extends OnceExtendedTask {
  constructor() {
    super();
  }
}


module.exports = {
  OnceExtendedTask,
  DoubleExtendedTask,
  NotExtendedTask
}