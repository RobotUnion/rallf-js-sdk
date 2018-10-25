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
  async get(device_name) {
    if (!this.devices || !this.devices.length || !this.devices.some((el) => el.name === device_name)) {
      return Promise.reject('Device not found: ' + device_name + ` - robot does not have that devices defined`);
    }

    let device = this.devices.find((el) => el.name === device_name);
    let builder = new Builder().forBrowser(device.name);
    let options = this._getOptions(device);

    if (device.name === 'firefox') {
      builder.setFirefoxOptions(options);
    }
    else if (device.name === 'chrome') {
      builder.setChromeOptions(options);
    }

    try {
      let deviceInstance = await builder.build();
      this._instances.push({ device_name: device_name, device: deviceInstance });
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
    return await device.quit();
  }

  /**
   * Quit all opened devices
   */
  async quitAll() {
    if (this._instances.length) {
      let promises = [];
      for (let i = 0; i < this._instances.length; i++) {
        promises.push(this._instances[i].device.quit());
      }
      await Promise.all(promises).then((res) => res).catch((err) => { });
    }
  }


  _getOptions(device) {
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

    return opts;
  }

  _setDevices(devices) {
    this.devices = devices;
  }
}

module.exports = Devices;

