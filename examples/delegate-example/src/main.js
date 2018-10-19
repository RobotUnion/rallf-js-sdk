const Task = require('../../../src/integration/task');

class DelegateExample extends Task {
  constructor() {
    super();
  }

  async start(input) {
    this.logger.debug('DelegateExample started');
    let res = await this.delegateLocal('Facebook', 'like', { post: 'some post' }, {});
    if (!res.error) {

    }
    return res;
  }
}
module.exports = DelegateExample;
