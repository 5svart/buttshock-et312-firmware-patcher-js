let bsCore = require('./buttshock-firmware-patcher-core');
var http = require('http');
var fs = require('fs');

var download = function(url, dest) {
  console.log("Downloading?");
  var file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => { console.log("Running promise?");http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      console.log("closing file!");
      file.close();  // close() is async, call cb after close completes.
      resolve();
    });
  }).on('error', function(err) { // Handle errors
    console.log("Errored");
    console.log(err);
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    reject(err.message);
  })});
};
class ButtshockFirmwarePatcher extends bsCore.ButtshockFirmwarePatcherCore
{
  static downloadFirmware() {
    if (!fs.existsSync('firmware')) {
      fs.mkdirSync('firmware');
    }
    return Promise.all([download('http://media.erostek.com.s3.amazonaws.com/support/312-15.upg', 'firmware/312-15.upg'),
                        download('http://media.erostek.com.s3.amazonaws.com/support/312-16.upg', 'firmware/312-16.upg')]);
  }
}

module.exports = {
  ButtshockFirmwarePatcher: ButtshockFirmwarePatcher
};

