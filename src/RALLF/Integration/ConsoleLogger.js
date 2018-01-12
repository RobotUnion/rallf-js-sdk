const AbstractLogger = require('./AbstractLogger')
class ConsoleLogger extends AbstractLogger {
  constructor() {
    super({
      notify: log => {
        console.log(` [${(new Date(log.time)).toLocaleString()}] - ${log.message}`)
      }
    })
  }
  capture(device, saveLocal, cback) {
    return new Promise((resolve, reject) => {
      let captureFN = saveLocal ? device.saveScreenshot.bind(device, 'img_' + Date.now() + '.png') :
        device.takeScreenshot;

      captureFN((err, resp) => {
        if (err) {
          this.error(
            'error',
            { "error": err },
            null,
            this.LOG_SEVERITY_DEBUG,
            ""
          );
          reject({ "error": err })
        }
        else {
          this.debug(
            'capture',
            { "capture": resp },
            null,
            this.LOG_SEVERITY_DEBUG,
            ""
          );
          resolve({ "capture": resp })
        }
      })
    })
  }
}

module.exports = ConsoleLogger;
