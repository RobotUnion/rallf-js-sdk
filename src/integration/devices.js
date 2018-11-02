'use strict';
const { Builder, WebDriver } = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');


/**
 * 
 */
class Devices {
  constructor() {
    this.devices = /** @type {any][]} */ ([]);
    this._instances = /** @type {WebDriver[]} */ ([]);
  }

  /**
   * Request access to a device. 
   * @arg {String} device_name
   * @returns {Promise<WebDriver>}
   * @rejects if device is not found or if build failed
   */
  async get(device_name, device_options) {
    if (!this.devices || !this.devices.length || !this.devices.some((el) => el.name === device_name)) {
      return Promise.reject('Device not found: ' + device_name + ` - robot does not have that devices defined`);
    }

    let device = this.devices.find((el) => el.name === device_name);
    let builder = new Builder().forBrowser(device.name);
    let options = await this._getOptions(device, device_options);

    if (device.name === 'firefox') {
      builder.setFirefoxOptions(options);
    }
    else if (device.name === 'chrome') {
      builder.setChromeOptions(options);
    }

    let cap = await builder.getCapabilities();
    cap.set('real-profile', options.real_profile);

    try {
      let deviceInstance = await builder.build();
      this._instances.push({ device_name: device_name, device: deviceInstance, options: device_options });


      return deviceInstance;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Close a device
   * @param {WebDriver} device 
   */
  async quit(device) {
    return device ? await device.close() : null;
  }

  /**
   * Quit all opened devices
   */
  async quitAll() {
    if (this._instances.length) {
      let promises = [];
      for (let i = 0; i < this._instances.length; i++) {
        promises.push(this._instances[i].device.close());
      }
      await Promise.all(promises).then((res) => res).catch((err) => { });
    }
  }

  async _getOptions(device, device_options = {}) {
    let opts;
    let deviceName = device.name;

    if (deviceName === 'firefox') {
      opts = new firefox.Options();
    }
    else if (deviceName === 'chrome') {
      opts = new chrome.Options();
    }

    if (device.headless === true) {
      opts = opts.headless();
    }

    if (device.screen) {
      opts = opts.windowSize(device.screen);
    }

    if (device_options.profile) {
      let profile = new firefox.Profile(device_options.profile);
      opts = opts.setProfile(profile);
    }

    return opts;
  }

  _setDevices(devices) {
    this.devices = devices;
  }
}

module.exports = Devices;

