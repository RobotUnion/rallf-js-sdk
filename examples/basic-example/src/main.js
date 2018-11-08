const rallf = require('../../../');

class BasicExample extends rallf.Task {
  constructor() {
    super();
    this.firefox = null;
  }

  async warmup() {
    this.logger.debug('warmup');
    this.firefox = await this.devices.get('firefox');
    await this.firefox.get('https://github.com');
  }

  async start(input) {
    this.logger.debug('BasicExample started');
    return 'started';
  }

  async getTitle(input) {
    return await this.firefox.getTitle();
  }

  async cooldown() {
    this.logger.debug('cooldown');
    await this.devices.quit(this.firefox);
  }
}
module.exports = BasicExample;
// {
//   "jsonrpc": "2.0",
//   "method": "event",
//   "params": {
//     "event": "warmup:end",
//     "data": {}
//   },
//   "id": "bt5mzosz"
// }