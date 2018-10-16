const { Task } = require('../../../');

class BasicExample extends Task {
  constructor() {
    super();
  }

  async start() {
    this.logger.debug('BasicExample started');
    let firefox = await this.devices.get('firefox');
    return 'finished';
  }

  async mock() {

  }
}
module.exports = BasicExample;
