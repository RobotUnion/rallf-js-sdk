class ConsoleLogger {
  constructor() {
    this.LOG_SEVERITY_EMERGENCY = 0;
    this.LOG_SEVERITY_ALERT = 1;
    this.LOG_SEVERITY_CRITICAL = 2;
    this.LOG_SEVERITY_ERROR = 3;
    this.LOG_SEVERITY_WARNING = 4;
    this.LOG_SEVERITY_NOTICE = 5;
    this.LOG_SEVERITY_INFO = 6;
    this.LOG_SEVERITY_DEBUG = 7;
  }

  /**
   * @param string message
   * @param mixed data
   * @param int severity , standard RFC3164 code (https://tools.ietf.org/html/rfc3164)
   * @param string channel
   */
  log(message, data = null, severity = 7, channel = "") {
    let log =
      {
        'time': Date.now(),
        'severity': severity,
        'channel': channel,
        'message': message,
        'data': data
      }
    console.log(` [${(new Date(log.time)).toLocaleString()}] - ${log.message}`)
  }

  capture(device, saveLocal, cback) {
    let captureFN = saveLocal ? device.saveScreenshot.bind(device, 'img_' + Date.now() + '.png') :
      device.takeScreenshot
    captureFN((err, res) => {
      this.debug('Capture', {
        "capture": res
      }, null, this.LOG_SEVERITY_DEBUG, "");
      if (typeof cback === 'function') cback(res);
    })
  }

  /**
   * @param $message
   * @param null $data
   * @param string $channel
   */
  debug(message, data = null, channel = "") {
    this.log(message, data, this.LOG_SEVERITY_DEBUG, channel);
  }

  /**
   * @param $message
   * @param null $data
   * @param string $channel
   */
  warning(message, data = null, channel = "") {
    this.log(message, data, this.LOG_SEVERITY_WARNING, channel);
  }

  /**
   * @param $message
   * @param null $data
   * @param string $channel
   */
  alert(message, data = null, channel = "") {
    this.log(message, data, this.LOG_SEVERITY_ALERT, channel);
  }

  /**
   * @param $message
   * @param null $data
   * @param string $channel
   */
  emergency(message, data = null, channel = "") {
    this.log(message, data, this.LOG_SEVERITY_EMERGENCY, channel);
  }

  /**
   * @param $message
   * @param null $data
   * @param string $channel
   */
  critical(message, data = null, channel = "") {
    this.log(message, data, this.LOG_SEVERITY_CRITICAL, channel);
  }

  /**
   * @param $message
   * @param null $data
   * @param string $channel
   */
  error(message, data = null, channel = "") {
    this.log(message, data, this.LOG_SEVERITY_ERROR, channel);
  }

  /**
   * @param $message
   * @param null $data
   * @param string $channel
   */
  info(message, data = null, channel = "") {
    this.log(message, data, this.LOG_SEVERITY_INFO, channel);
  }
}

module.exports = ConsoleLogger;
