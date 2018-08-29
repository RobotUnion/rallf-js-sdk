const AbstractLogger = require('./AbstractLogger')
class IdeLogger extends AbstractLogger {
  constructor(process) {
    super({
      notify: log => {
        let severity = this.getSeverity(log.severity);
        let msg = `[${(new Date(log.time)).toLocaleString()}] - ${severity} - ${log.message}`;
        if (log.data && !log.data.capture) {
          msg += ` - ${JSON.stringify(log.data)}`;
        }
        process.stdout.write('task:log ' + JSON.stringify({ log, msg }));
      }
    });
  }

  getSeverity(num) {
    return [
      '<span class=\"text-warning\">EMERGENCY</span>',
      '<span class=\"text-warning\">ALERT</span>',
      '<span class=\"text-danger\">CRITICAL</span>',
      '<span class=\"text-danger\">ERROR</span>',
      '<span class=\"text-warning\">WARNING</span>',
      '<span class=\"text-info\">NOTICE</span>',
      '<span class=\"text-success\">INFO</span>',
      '<span class=\"text-primary\">DEBUG</span>',
    ][num];
  }
}

module.exports = IdeLogger;