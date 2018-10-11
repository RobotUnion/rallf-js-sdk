const Task = require('../src/Integration/Task');

class RallfSdk extends Task {
  constructor() {
    super();
  }

  async run() {
    this.input.post_urls = this.input.post_urls || ['https://www.facebook.com/manolo.tejerogomez/posts/10209446479798542'];

    this.logger.debug('Example robot: ', this.robot);

    // this.robot.kb.posts = ['https://www.facebook.com/manolo.tejerogomez/posts/10209446479798542'];

    // await this.persist();
    await this.delegate('FacebookLogin', 'like', { post_url: this.input.post_urls.pop() }, { auto_terminate: true });

    return 'done';
  }
}
module.exports = RallfSdk;
