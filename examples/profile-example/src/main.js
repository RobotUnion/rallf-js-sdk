const rallf = require('../../../');
const fs = rallf.fs;
const { By, until, Key } = require('selenium-webdriver');

class FirefoxProfileExample extends rallf.Task {
  constructor() {
    super();
    this.firefox = null;
  }

  async warmup() {
    this.logger.debug('warmup');
    this.firefox = await this.devices.get('firefox', {
      profile: this.home + '/custom-profile'
    });
    await this.firefox.get('https://github.com');
  }

  async isLoggedIn() {
    let title = await this.firefox.getTitle();
    this.logger.debug(title + ' - Logged In: ' + (title === 'GitHub'));
    return title === 'GitHub';
  }

  async login() {
    await this.firefox.get('https://github.com/login');

    let usernameElem = await this.firefox.findElement(By.id('login_field'));
    let passwordElem = await this.firefox.findElement(By.id('password'));

    await usernameElem.sendKeys('keff-bot');
    await passwordElem.sendKeys('Bots4Life', Key.ENTER);

    this.logger.debug('Logged in');

    await this.firefox.sleep(6e3);
  }

  async start(input) {
    this.logger.debug('FirefoxProfileExample started');
    if (!(await this.isLoggedIn())) {
      this.logger.debug('Logging in');
      await this.login();
    } else {
      this.logger.debug('Already logged in');
    }
    return 'finished';
  }

  async saveProfile() {
    let profile = await this.firefox.getCapabilities().get('moz:profile');
    await fs.copy(profile, this.home + '/custom-profile', {
      filter: (orig, dest) => (!orig.includes('parent.lock') && fs.existsSync(orig))
    });
  }

  async cooldown() {
    await this.saveProfile();
    this.logger.debug('cooldown');
  }
}
module.exports = FirefoxProfileExample;
