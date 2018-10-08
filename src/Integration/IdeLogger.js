const AbstractLogger = require('./AbstractLogger')
class IdeLogger extends AbstractLogger {
  constructor(process, pretty) {
    super({
      notify: log => {
        if (pretty) {
          process.stdout.write(`[${new Date(log.time).toLocaleString()}] - ${log.severity} - ${log.message} - ${JSON.stringify(log.data)}\n`);
        }
        else process.stdout.write('\ntask:log ' + JSON.stringify(log) + '\n');
      }
    });
  }
}

module.exports = IdeLogger;
