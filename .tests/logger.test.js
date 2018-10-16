const { Task, Robot, Logger, Devices } = require('../src/integration');

describe('Logger should', () => {
  it(`be defined`, () => {
    expect(Logger).toBeDefined();
  });

  const isMethodAFunction = (method_name) => () => expect(typeof Logger.prototype[method_name]).toEqual('function');

  it(`contain method: log`, isMethodAFunction('log'));
  it(`contain method: debug`, isMethodAFunction('debug'));
  it(`contain method: info`, isMethodAFunction('info'));
  it(`contain method: error`, isMethodAFunction('error'));
  it(`contain method: warning`, isMethodAFunction('warning'));
  it(`contain method: emergency`, isMethodAFunction('emergency'));
  it(`contain method: critical`, isMethodAFunction('critical'));
  it(`contain method: capture`, isMethodAFunction('capture'));
});