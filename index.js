const patcher = require('./lib/buttshock-firmware-patcher');
const args = require('commander');
const fs = require('fs');

args
  .version('0.0.1')
  .option('-f, --file <file>', 'firmware file to load')
  .option('-p, --patch <file>', 'patch file to load')
  .option('-d, --download', 'Download firmware')
  .parse(process.argv);

if (args.download) {
  let p = patcher.ButtshockFirmwarePatcher.downloadFirmware();
  p.then(() => { console.log("Downloads done!"); }, () => { console.log("Downloads errored out!"); });
} else {
  if (args.file === undefined) {
    throw Error('Must specify a file to operate on!');
  }

  var bytes = fs.readFileSync(args.file);
  let p = new patcher.ButtshockFirmwarePatcher(bytes);
  var patch = fs.readFileSync(args.patch, 'ascii');
  p.applyPatches(patch);
}
