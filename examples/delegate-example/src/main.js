const Task = require('../../../src/integration/task');

class DelegateExample extends Task {
  constructor() {
    super();
  }

  async start(input) {
    try {
      this.logger.debug('DelegateExample started');
      // let res = await this.robot.delegateLocal('com.test.task', 'like', { post: 'some post' }, {});

      let res = await this.robot.delegateRemote('com.test.task', 'like', { post: 'some post' }, {});

      if (res.error) {
        this.logger.error(res.error);
      }
      return res;
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = DelegateExample;
