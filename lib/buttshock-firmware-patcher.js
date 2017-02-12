const md5 = require('md5');

class ButtshockFirmwarePatcher {

  static get FIRMWARE_15_MD5() {
    return "7fbc25734dc894f822fd361e1f1c45e3";
  }

  static get FIRMWARE_16_MD5() {
    return "ae5ea93c5774885cbe73e547c6b526a8";
  }

  constructor(firmware_file) {
    this.firmware_file = firmware_file;
    let hash = md5(this.firmware_file);
    if (hash === ButtshockFirmwarePatcher.FIRMWARE_15_MD5) {
      console.log("Got 1.5 firmware!");
    } else if (hash === ButtshockFirmwarePatcher.FIRMWARE_16_MD5) {
      console.log("Got 1.6 firmware!");
    } else {
      throw "Unrecognized firmware file!";
    }
  }

  applyPatches(patches) {
    let lines = patches.split('\n');
    let patched = 0;
    let map_parse = (x) => { return parseInt(x, 16); };
    for (let i = 0; i < lines.length; i = i + 1) {
      let l = lines[i];
      let replace_re = new RegExp('<replace_([^>]+)');
      let match = replace_re.exec(l);
      if (match) {
        let replace_start = parseInt(match[1], 16);
        let replace_with = [];
        i = i + 1;
        l = lines[i];
        while (l.search(':') > -1) {
          replace_with = replace_with.concat(l
                                             .split('\t')[1]
                                             .trim()
                                             .split(' ')
                                             .map(map_parse));
          i = i + 1;
          l = lines[i];
        }
        console.log(replace_with);
        for (let byte of replace_with) {
          this.firmware_file[replace_start] = byte;
          replace_start += 1;
          patched += 1;
        }
      } else if (l.search('<.avr.prop>') > -1) {
        while (l.search(':') > -1) {
          i = i + 1;
          l = lines[i];
        }
      } else if (l.search(':') > -1) {
        let location;
        let bytes;
        try {
          location = parseInt(l
                              .split('\t')[0]
                              .trim()
                              .slice(0, -1), 16);
          //console.log("location: " + location);
          bytes = l
            .split('\t')[1]
            .trim()
            .split(' ')
            .map(map_parse);
        } catch (e) {
          continue;
        }
        for (let byte of bytes) {
          this.firmware_file[location] = byte;
          console.log("Patched " + location + " with " + byte);
          location += 1;
          patched += 1;
        }
      }
    }
  }
}

module.exports = {
  ButtshockFirmwarePatcher: ButtshockFirmwarePatcher
};
