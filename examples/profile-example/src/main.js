const rallf = require('../../../');
const fs = rallf.fs;
const rcopy = require('recursive-copy');
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

    if (!(await this.isLoggedIn())) {
      this.logger.debug('Logging in');
      await this.login();
    } else {
      this.logger.debug('Already logged in');
    }
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

    let data = this.robot.readJSON('data.json');

    await usernameElem.sendKeys(data.username);
    await passwordElem.sendKeys(data.password, Key.ENTER);

    this.logger.debug('Logged in');

    await this.firefox.sleep(6e3);
  }

  async start(input) {
    // this.logger.debug('FirefoxProfileExample started');
    // if (!(await this.isLoggedIn())) {
    //   this.logger.debug('Logging in');
    //   await this.login();
    // } else {
    //   this.logger.debug('Already logged in');
    // }
    // return 'finished';
  }

  async followUser(input) {
    this.logger.debug('Trying to follow user: ' + input.username);
    await this.firefox.get('https://github.com/' + input.username);

    try {
      let followBtn = await this.firefox.findElement(By.xpath('/html/body/div[4]/div[1]/div/div[1]/div[4]/span/span[1]/form/button'));
      await followBtn.click();
      this.logger.debug('Followed user: ' + input.username);
    } catch (error) {
      this.logger.error('Error following user: ' + input.username + ' - ' + error);
    }
  }

  async saveProfile() {
    let capabilities = await this.firefox.getCapabilities();
    let profile = capabilities.get('moz:profile');
    await rcopy(profile, this.home + '/custom-profile', {
      overwrite: true,
      filter: (orig, dest) => (!orig.includes('parent.lock') && fs.existsSync(orig))
    });
  }

  async cooldown() {
    await this.saveProfile();
    this.logger.debug('cooldown');
  }
}
module.exports = FirefoxProfileExample;
