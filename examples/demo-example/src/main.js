/* File: 'src/main.js' */
const { Task } = require('../../../');

class RobotDevExample extends Task {
  constructor() {
    super();
    this.firefox = null;
  }

  /**
   * This function will run once everything is properly loaded and set to go
   */
  async start() {

    try {
      // Initialize firefox and return instance of WebDriver
      this.firefox = await this.devices.get('firefox');

      // You can log stuff via the available logger
      this.logger.debug(`Task RobotDevExample started`);

      // Let's load github.com
      await this.firefox.get('https://github.com');

      // Let's get the title
      let title = await this.firefox.getTitle();

      return title;
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = RobotDevExample;