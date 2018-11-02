const rallf = require('../../../');

class GihubSkill extends rallf.Task {
  constructor() {
    super();
    this.firefox = null;
  }

  async warmup() {
    this.logger.debug('warmup');
    this.firefox = await this.devices.get('firefox');
    await this.firefox.get('https://github.com');
    this.logger.debug('GihubSkill example started');
  }

  async getTitle(input) {
    let title = await this.firefox.getTitle();
    return title;
  }
}
module.exports = GihubSkill;
// { "method" : "delegate_local", "params" : { "routine": "getTitle" }, "id" : 123 }