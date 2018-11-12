const now = (unit) => {
  const hrTime = process.hrtime();
  let result = 0;
  switch (unit) {
    case 'milli':
      result = hrTime[0] * 1000 + hrTime[1] / 1000000;
    case 'micro':
      result = hrTime[0] * 1000000 + hrTime[1] / 1000;
    case 'nano':
      result = hrTime[0] * 1000000000 + hrTime[1];
    default:
      result = hrTime[0] * 1000000000 + hrTime[1];
  }

  return parseFloat(result.toFixed(6));
};



/**
 * @param {function()} fn
 * @return {{ timed: { start_time: number, start_millis: number,  end_time: number, end_millis: number, duration_millis: number, }, result: any }}
 */
now.timeFnExecution = (fn, args) => {
  let start_time = Date.now();
  let start_millis = now('milli').toFixed(6);
  let result = fn();
  let end_millis = now('milli').toFixed(6);
  let end_time = Date.now();

  let duration_millis = end_millis - start_millis;

  return {
    timed: {
      start_time,
      start_millis,
      end_time,
      end_millis,
      duration_millis,
      fn: fn
    },
    return: result
  }
};


/**
 * @param {function(args)} fn
 * @return {Promise<{ timed: { start_time: number, start_millis: number,  end_time: number, end_millis: number, duration_millis: number, }, result: any }>}
 */
now.timeFnExecutionAsync = async (fn, args) => {
  let start_time = Date.now();
  let start_millis = now('milli').toFixed(6);
  let result = await Promise.resolve(fn(args));
  let end_millis = now('milli').toFixed(6);
  let end_time = Date.now();

  let duration_millis = end_millis - start_millis;

  return {
    timed: {
      start_time,
      start_millis,
      end_time,
      end_millis,
      duration_millis,
      fn: fn
    },
    return: result
  }
};

module.exports = now;