const md5 = require('md5');

class ButtshockFirmwarePatcherCore {

  static get FIRMWARE_15_ENCRYPTED_MD5() {
    return "7fbc25734dc894f822fd361e1f1c45e3";
  }

  static get FIRMWARE_16_ENCRYPTED_MD5() {
    return "ae5ea93c5774885cbe73e547c6b526a8";
  }

  static get KEYS() {
    return [0x65, 0xed, 0x83];
  }

  static get IV() {
    return [0xb9, 0xfe, 0x8f];
  }

  constructor(firmware_file) {
    this.firmware = firmware_file;
    this.version = "unknown";
    let hash = md5(this.firmware);
    if (hash === ButtshockFirmwarePatcher.FIRMWARE_15_ENCRYPTED_MD5) {
      this.version = "1.5 Encrypted";
    } else if (hash === ButtshockFirmwarePatcher.FIRMWARE_16_ENCRYPTED_MD5) {
      this.version = "1.6 Encrypted";
    }
  }

  generate_checksum(file) {
    let xor = 0;
    let add = 0;

    // The last 16 bytes of the firmware do not factor into the checksum.
    for (let i = 0; i < 15872 - 16; i = i + 1) {
      xor = xor ^ file[i];
      add = add + file[i];
    }
    return [xor, (add & 0xff), ((add >> 8) & 0xff)];
  }

  encrypt() {
    let funcs = [(x) => { return ((x >= 0x41 ? x - 0x41 : ((x - 0x41) + 0x100)) ^ 0x62) & 0xff; },
                 (x) => { return (x >> 4) | ((x & 0x0f) << 4); },
                 (x) => { return x; }];
    let iv = ButtshockFirmwarePatcher.IV;
    let encrypted_firmware = [];
    this.firmware.map((byte) => {
      let choice = encrypted_firmware.length % 3;
      let output = funcs[choice](byte
                                 ^ iv[choice]
                                 ^ ButtshockFirmwarePatcher.KEYS[choice]);
      encrypted_firmware.push(output);
      iv[choice] = output;
    });
    return encrypted_firmware;
  }

  decrypt() {
    let funcs = [(x) => { return ((x ^ 0x62) + 0x41) & 0xff;},
                 (x) => { return (x >> 4) | ((x & 0x0f) << 4); },
                 (x) => { return x; }];
    let iv = ButtshockFirmwarePatcher.IV;
    let decrypted_firmware = [];
    this.firmware.map((byte) => {
      let choice = decrypted_firmware.length % 3;
      let output = funcs[choice](byte
                                 ^ iv[choice]
                                 ^ ButtshockFirmwarePatcher.KEYS[choice]);
      decrypted_firmware.push(output);
      iv[choice] = output;
    });
    return decrypted_firmware;
  }

  applyPatches(patches) {
    this.modified_firmware_file = this.decrypt();
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
