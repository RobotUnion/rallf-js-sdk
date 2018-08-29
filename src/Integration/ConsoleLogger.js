const AbstractLogger = require('./AbstractLogger')
class ConsoleLogger extends AbstractLogger {
  constructor() {
    super({
      notify: log => console.log(` [${(new Date(log.time)).toLocaleString()}] - ${log.message}`)
    })
  }

  /**
   * @method capture
   * @param {WebDriver} device 
   * @param {Boolean} saveLocal 
   */
  capture(device, saveLocal = false) {
    return new Promise((resolve, reject) => {
      let fname = 'img_' + Date.now() + '.png';
      let captureFN = saveLocal
        ? device.saveScreenshot.bind(device, fname)
        : device.takeScreenshot;

      captureFN((error, capture) => {
        if (error) {
          this.error('error', { error });
          reject({ error });
        }
        else {
          this.debug('capture: ' + fname, { capture });
          resolve({ capture });
        }
      })
    })
  }
}

module.exports = ConsoleLogger;
