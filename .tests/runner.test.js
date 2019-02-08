const {
  Runner
} = require('../src/lib');

const {
  DoubleExtendedTask,
  OnceExtendedTask,
  NotExtendedTask
} = require('./test-tasks/extending');

const fs = require('fs-extra');

jest.setTimeout(120e3);

let cwd = process.cwd();

describe('Runner tests', () => {

  const runner = new Runner();

  it(`should be defined`, () => {
    expect(Runner).toBeDefined();
  });

  const isMethodAFunction = (method_name) => () => expect(typeof Runner.prototype[method_name]).toEqual('function');

  it(`should contain method: runTask`, isMethodAFunction('runTask'));

  it(`"runTask" checks for invalid inheritance`, async () => {
    try {
      await runner.runTask(new NotExtendedTask(), {});
    } catch (e) {
      expect(e).toEqual({
        error: 'ERROR: Task seams to not be a valid rallf.Task, please make sure your class extends rallf.Task'
      });
    }
  });

  it(`"runTask" direct inheritance works`, async () => {
    let res = await runner.runTask(new OnceExtendedTask(), {});
    expect(res).toEqual('worked');
  });

  it(`"runTask" indirect inheritance works`, async () => {
    let res = await runner.runTask(new DoubleExtendedTask(), {});
    expect(res).toEqual('worked');
  });

  it(`should throw error if path is not a task`, () => {
    expect(() => runner.getManifest('ads').error).toBeDefined();
  });

  it(`should not throw error if path is a task`, () => {
    expect(() => runner.getManifest('./.tests/test-tasks/basic-example')).not.toThrowError();
  });

  it(`.getManifest should return correct data`, () => {
    let mani = fs.readJSONSync('./.tests/test-tasks/basic-example/config/manifest.json');
    expect(runner.getManifest('./.tests/test-tasks/basic-example')).toEqual(mani);
  });

  it(`.getTask should throw error if bad task passed`, () => {
    expect(() => runner.createTask('./.tests/test-tasks/non-existing', {})).toThrowError();
  });

  // it(`.getTask should return a task`, () => {
  //   // process.chdir(cwd);
  //   let manifest = runner.getManifest('./.tests/test-tasks/basic-example');
  //   let mock = runner.getMock('./.tests/test-tasks/basic-example', 'test');
  //   let task = runner.createTask('./.tests/test-tasks/basic-example', manifest, 'null-robot');
  //   expect(task.__proto__.constructor.__proto__.name).toEqual('Task');
  // });

  it(`should run "basic-example" and return 'start'`, async () => {
    process.chdir(cwd);
    let manifest = runner.getManifest('./.tests/test-tasks/basic-example');
    let task = runner.createTask('./.tests/test-tasks/basic-example', manifest);
    let res = await runner.runMethod(task, 'start', {}, false);
    expect(res).toEqual('started');
  });
});