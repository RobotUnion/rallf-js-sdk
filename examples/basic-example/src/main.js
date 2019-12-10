const rallf = require('../../../');
// const rallf = require('rallf-js-sdk'); 

class BasicExample extends rallf.Task {
  constructor() {
    super();
  }

  async warmup() {
    this.logger.info('Warming up ' + this.name);
    this.firefox = this.devices.get('firefox');
  }

  async start(input) {
    this.logger.debug(this.fqtn + ' started');
    return 'started';
  }

  async getTitle(input) {
    return await this.firefox.getTitle();
  }

  async cooldown() {
    this.logger.debug('cooldown');
    // await this.firefox.quit();
  }
}
module.exports = BasicExample;
