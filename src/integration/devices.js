'use strict';
const {
  Builder,
  WebDriver
} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');
const wdio = require('webdriverio');


/**
 * 
 */
class Devices {
  constructor() {
    this.devices = /** @type {any][]} */ [];
    this._instances = /** @type {WebDriver[]} */ [];
  }

  /**
   * Request access to a device. 
   * @arg {String} device_name
   * @returns {Promise<WebDriver>|wdio.Client<void>}
   * @rejects if device is not found or if build failed
   */
  get(device_name, device_options) {
    try {
      let device = this.devices[device_name];

      // console.log("Getting device: ", device);

      if (!device) {
        throw new Error('Device not found: ' + device_name + ' - robot does not have that devices defined');
      }
      if (device.kind === 'driver') {
        return new Promise(async (resolve, reject) => {
          let builder = new Builder().forBrowser(device.name);
          let options = await this._getOptions(device, device_options);

          if (device.name === 'firefox') {
            if (device.driver) options.useGeckoDriver(device.driver);
            if (device.bin) options.setBinary(device.bin);
            builder.setFirefoxOptions(options);
          } else if (device.name === 'chrome') {
            if (device.driver) options.setProperty('webdriver.chrome.driver', device.driver);
            if (device.bin) options.setChromeBinaryPath(device.bin);
            builder.setChromeOptions(options);
          }

          let deviceInstance = await builder.build();
          this._instances.push({
            device_name: device_name,
            device: deviceInstance,
            options: device_options
          });

          resolve(deviceInstance);
        });
      } else if (device.kind === 'remote') {
        // console.log("Is remote");
        const opts = {
          port: device.port,
          desiredCapabilities: {
            platformName: device.name,
            platformVersion: device.version,
            deviceName: 'keff',
            appPackage: device.app_package,
            appActivity: device.app_activity,
            automationName: 'UiAutomator2',
            host: device.host,
            port: device.port
          }
        };

        const client = wdio.remote(opts).init();

        return client;
      }
    } catch (error) {
      throw new Error(error);
    }

    return null;
  }

  build(device_name, device_options) {
    let device = this.devices[device_name];

    return function buildFactory() {
      console.log('Is remote');
      const opts = {
        port: device.port,
        desiredCapabilities: {
          platformName: device.name,
          platformVersion: device.version,
          deviceName: 'keff',
          appPackage: device.app_package,
          appActivity: device.app_activity,
          automationName: 'UiAutomator2',
          host: device.host,
          port: device.port
        }
      };

      return wdio.remote(opts).init();
    };
  }


  /**
   * Close a device
   * @param {WebDriver} device 
   */
  quit(device) {
    return device ? device.close() : null;
  }

  /**
   * Quit all opened devices
   */
  async quitAll() {
    if (this._instances.length) {
      let promises = [];
      for (let index = 0; index < this._instances.length; index++) {
        promises.push(this._instances[index].device.quit());
      }
      await Promise.all(promises).then((res) => res);
    }
  }

  async _getOptions(device, device_options = {}) {
    let opts;
    let deviceName = device.name;

    if (deviceName === 'firefox') {
      opts = new firefox.Options();
    } else if (deviceName === 'chrome') {
      opts = new chrome.Options();
    }

    if (device.headless === true) {
      opts = opts.headless();
    }

    if (device.screen) {
      opts = opts.windowSize(device.screen);
    }

    if (device_options.profile && deviceName === 'firefox') {
      let profile = new firefox.Profile(device_options.profile);
      opts = opts.setProfile(profile);
    }
    if (device_options.profile && deviceName === 'chrome') {
      opts.addArgument(`user-data-dir=${device_options.profile}`);
    }

    return opts;
  }

  _setDevices(devices) {
    this.devices = devices;
  }
}

module.exports = Devices;