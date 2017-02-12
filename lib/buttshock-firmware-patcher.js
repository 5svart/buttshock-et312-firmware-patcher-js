const crypto = require('crypto');

class ButtshockFirmwarePatcher {

  static get FIRMWARE_15_MD5() {
    return "7fbc25734dc894f822fd361e1f1c45e3";
  }

  static get FIRMWARE_16_MD5() {
    return "ae5ea93c5774885cbe73e547c6b526a8";
  }

  constructor(firmware_file) {
    this.firmware_file = firmware_file;
    var hash = crypto.createHash('md5').update(this.firmware_file).digest("hex");
    if (hash === ButtshockFirmwarePatcher.FIRMWARE_15_MD5) {
      console.log("Got 1.5 firmware!");
    } else if (hash === ButtshockFirmwarePatcher.FIRMWARE_16_MD5) {
      console.log("Got 1.6 firmware!");
    } else {
      throw "Unrecognized firmware file!";
    }
  }
}

module.exports = {
  ButtshockFirmwarePatcher: ButtshockFirmwarePatcher
};
