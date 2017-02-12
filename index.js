const patcher = require('./lib/buttshock-firmware-patcher');
const args = require('commander');
const fs = require('fs');

args
  .version('0.0.1')
  .option('-f, --file <file>', 'firmware file to load')
  .parse(process.argv);

if (args.file === undefined) {
  throw Error('Must specify a file to operate on!');
}

var bytes = fs.readFileSync(args.file);
console.log(bytes.length);
let p = new patcher.ButtshockFirmwarePatcher(bytes);

