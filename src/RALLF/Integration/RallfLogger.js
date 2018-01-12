
const AbstractLogger = require('./AbstractLogger')

class RallfLogger extends AbstractLogger {
  constructor(notifier) {
    super(notifier)
  }
}

module.exports = RallfLogger;
