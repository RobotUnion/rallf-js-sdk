const rallf = require('../../../');
class BasicExample extends rallf.Task {
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
  }
}
module.exports = BasicExample;
