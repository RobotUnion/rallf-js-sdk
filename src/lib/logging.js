"use strict";
const loggin = require("loggin-js");
const pkg = require("../../package.json");

class StdNotifier extends loggin.Notifier {
  constructor(options) {
    super(options, "std");
    this.lineIndex = 0;
  }

  output(message, log) {
    let logOut = message;
    if (this.options.lineNumbers) {
      logOut = this.getLineWithNumber(message);
    }

    if (log.level.level <= loggin.severity("ERROR").level) {
      process.stderr.write(logOut + "\n");
    } else {
      process.stdout.write(logOut + "\n");
    }

    return this;
  }
}

const logger = loggin.logger({
  channel: pkg.name,
  formatter: process.env.LOGGER_FORMATTER || "detailed",
  level: loggin.severity(process.env.DEBUG ? "DEBUG" : "INFO"),
  notifiers: [
    new StdNotifier()
  ]
});

module.exports.loggin = loggin;
module.exports.logger = logger;
