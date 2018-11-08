const rallf = require('../../../');
const wdio = require("webdriverio");
const rallfCv = require("../lib/rallf-open-cv");


class BasicExample extends rallf.Task {
  constructor() {
    super();
    this.android = null;
    this.cv = new rallfCv();
  }

  async warmup() {
    this.logger.debug('cwd: ' + process.cwd());

    /**
     * @param android
     * @type {wdio.Client<any>}
     */
    this.android = this.devices.get('android');
    await this.android.saveScreenshot('initial-capture.png');
  }

  async start(input) {
    this.logger.debug('BasicExample started');

    await this.android.startActivity("com.android.vending", "com.google.android.finsky.activities.MainActivity")
      .touchPerform([
        { action: 'tap', options: { x: 300, y: 170 } }
      ])
      .keys('chip-chap\uE007');

    let sshot = await this.android.saveScreenshot('check.png');
    let match = this.cv.match('check.png', 'icon.png');
    console.log(match);
  }

  async cooldown() {
    this.logger.debug('cooldown');
    await this.devices.quit(this.firefox);
  }
}
module.exports = BasicExample;
