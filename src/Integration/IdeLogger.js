const AbstractLogger = require('./AbstractLogger')
const clc = require('../../bin/clc');

class IdeLogger extends AbstractLogger {
  constructor(process, pretty) {
    super({
      notify: log => {
        if (pretty) {
          process.stdout.write(`${clc.success('LOG')} [${new Date(log.time).toLocaleString()}] - ${this.getString(log.severity)} - ${log.message} - ${JSON.stringify(log.data)}\n`);
        }
        else process.stdout.write('\ntask:log ' + JSON.stringify(log) + '\n');
      }
    });
  }

  getString(severity) {
    return [
      'EMERGENCY',
      'ALERT',
      'CRITICAL',
      'ERROR',
      'WARNING',
      'NOTICE',
      'INFO',
      'DEBUG',
    ][severity]
  }
}

module.exports = IdeLogger;
