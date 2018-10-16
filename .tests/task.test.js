const { Task, Robot, Logger, Devices } = require('../src/integration');

describe('Task should', () => {
  it(`be defined`, () => {
    expect(Task).toBeDefined();
  });

  const isMethodAFunction = (method_name) => () => expect(typeof Task.prototype[method_name]).toEqual('function');

  it(`contain method: start`, isMethodAFunction('start'));
  it(`contain method: delegateLocal`, isMethodAFunction('delegateLocal'));
  it(`contain method: delegateExternal`, isMethodAFunction('delegateExternal'));

  let task = new Task({}, 'id');
  const isPropInstanceOf = (prop, type) => () => expect(task[prop]).toBeInstanceOf(type);

  it(`Task.logger should be instance of Logger`, isPropInstanceOf('logger', Logger));
});