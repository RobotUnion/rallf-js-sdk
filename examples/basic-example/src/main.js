const rallf = require('../../../');

class BasicExample extends rallf.Task {
  constructor() {
    super();
    this.firefox = null;
  }

  async warmup() {
    this.logger.debug('warmup');
    this.logger.debug('cwd: ' + process.cwd());
    this.firefox = await this.devices.get('firefox');
  }

  async start(input) {
    this.logger.debug('BasicExample started');

    this.robot.saveJSON('data.json', { test: 'asdads' });

    let data = this.robot.readJSON('data.json');

    this.logger.debug('Data saved: ', data);
    return 'finished';
  }

  async cooldown() {
    this.logger.debug('cooldown');
    await this.devices.quit(this.firefox);
  }
}
module.exports = BasicExample;
