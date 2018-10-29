

const child_process = require('child_process');
const stream = require('stream');
const path = require('path');
let customStream = new stream.Writable();


customStream._write = function (data) {
  data = data.toString();
  console.log('rpc-stdio', data);
  if (data.includes('jsonrpc')) {
    data = JSON.parse(data.toString());
    console.log('rpc-stdio', JSON.stringify({ jsonrpc: '2.0', method: 'update', params: data, id: data.id }));
  } else {
    console.log('rpc-stdio', 'norpc: ' + data);
  }
};


let cp = child_process.spawn('python', ['-u', path.resolve('./tests/test.py')]);
cp.stdout.pipe(customStream);
// cp.stderr.pipe(process.stderr);


// cp.stdout.on('message', (data) => {
//   console.log('rpc-stdio', data);
// });

cp.stdin.write(JSON.stringify({ jsonrpc: 2.0, params: {}, id: 1, method: 'sendupdates' }));