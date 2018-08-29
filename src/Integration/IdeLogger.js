const AbstractLogger = require('./AbstractLogger')
class IdeLogger extends AbstractLogger {
  constructor(process) {
    super({
      notify: log => {
        process.stdout.write('task:log ' + JSON.stringify(log));
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
