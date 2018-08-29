const AbstractLogger = require('./AbstractLogger')
class IdeLogger extends AbstractLogger {
  constructor(process) {
    super({
      notify: log => {
        process.stdout.write('\r\ntask:log ' + JSON.stringify(log) + '\n\r');
      }
    });
  }
}

module.exports = IdeLogger;
