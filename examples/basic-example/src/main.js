const { Task } = require('../../../');

class BasicExample extends Task {
  constructor() {
    super();
  }

  async start() {
    this.logger.debug('BasicExample started');
    let firefox = await this.devices.get('firefox');
    this.robot.saveJSON('data.json', { test: 'asdads' });
    let data = this.robot.readJSON('data.json');
    this.logger.debug('Data saved: ', data);
    return 'finished';
  }

  async mock() {

  }
}
module.exports = BasicExample;
