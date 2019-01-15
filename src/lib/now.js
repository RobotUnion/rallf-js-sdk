'use strict';

// Millis
const start = process.hrtime.bigint();
const offset = BigInt(Date.now() * 1e6) - start;

const now = () => {
  const hrTime = process.hrtime();
  let result = BigInt(hrTime[0] * 1e9 + hrTime[1]);
  return parseFloat([
    parseInt((result + offset) / BigInt(1e9)),
    parseInt((result + offset) % BigInt(1e9)),
  ].join('.'));
};

/**
 * @param {function()} fn
 */
now.timeFnExecution = (fn, args) => {
  let start_time = Date.now();
  const time = process.hrtime();
  let result = fn(args);
  const diff = process.hrtime(time);
  let end_time = Date.now();

  let duration_millis = (diff[0] * 1e9 + diff[1]) / 1000000;

  return {
    timed: {
      start_time,
      end_time,
      duration_millis,
      fn: fn
    },
    return: result
  };
};


/**
 * @param {function(args)} fn
 */
now.timeFnExecutionAsync = async (fn, args) => {
  let start_time = Date.now();
  const time = process.hrtime();
  let result = await Promise.resolve(fn(args));
  const diff = process.hrtime(time);
  let end_time = Date.now();

  let duration_millis = (diff[0] * 1e9 + diff[1]) / 1000000;

  return {
    timed: {
      start_time,
      end_time,
      duration_millis,
      fn: fn
    },
    return: result
  };
};

module.exports = now;