const {
  OnceExtendedTask,
  NotExtendedTask
} = require('../../extending');

class TestTask1 extends OnceExtendedTask {
  constructor() {
    super();
  }

  async warmup() {
    this.logger.debug('warmup');
    this.test();
  }

  async start(input) {
    this.logger.debug(this.fqtn + ' started');
    return 'started';
  }


  async cooldown() {
    this.logger.debug('cooldown');
  }
}
module.exports = TestTask1;