const md5 = require('md5');

class ButtshockFirmwarePatcherCore {

  static get FIRMWARE_LENGTH() {
    return 15872;
  }

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

  constructor(firmware_buffer) {
    if (!firmware_buffer) {
      throw Error("Must have a firmware buffer to work with!");
    }
    this.firmware = firmware_buffer;
    this.version = "unknown";
    if (this.firmware.length != ButtshockFirmwarePatcherCore.FIRMWARE_LENGTH) {
      throw Error("Firmware length must be 15872 bytes!");
    }
    let hash = md5(this.firmware);
    if (hash === ButtshockFirmwarePatcherCore.FIRMWARE_15_ENCRYPTED_MD5) {
      this.version = "1.5 Encrypted";
    } else if (hash === ButtshockFirmwarePatcherCore.FIRMWARE_16_ENCRYPTED_MD5) {
      this.version = "1.6 Encrypted";
    }
  }

  generate_checksum(file) {
    let xor = 0;
    let add = 0;

    // The last 16 bytes of the firmware do not factor into the checksum.
    for (let i = 0; i < ButtshockFirmwarePatcherCore.FIRMWARE_LENGTH - 16; i = i + 1) {
      xor = xor ^ file[i];
      add = add + file[i];
    }
    return [xor, (add & 0xff), ((add >> 8) & 0xff)];
  }

  encrypt() {
    let funcs = [(x) => { return ((x >= 0x41 ? x - 0x41 : ((x - 0x41) + 0x100)) ^ 0x62) & 0xff; },
                 (x) => { return (x >> 4) | ((x & 0x0f) << 4); },
                 (x) => { return x; }];
    let iv = ButtshockFirmwarePatcherCore.IV;
    let encrypted_firmware = [];
    this.firmware.map((byte) => {
      let choice = encrypted_firmware.length % 3;
      let output = funcs[choice](byte
                                 ^ iv[choice]
                                 ^ ButtshockFirmwarePatcherCore.KEYS[choice]);
      encrypted_firmware.push(output);
      iv[choice] = output;
    });
    return encrypted_firmware;
  }

  decrypt() {
    let funcs = [(x) => { return ((x ^ 0x62) + 0x41) & 0xff;},
                 (x) => { return (x >> 4) | ((x & 0x0f) << 4); },
                 (x) => { return x; }];
    let iv = ButtshockFirmwarePatcherCore.IV;
    let decrypted_firmware = [];
    this.firmware.map((byte) => {
      let choice = decrypted_firmware.length % 3;
      let output = funcs[choice](byte)
                                 ^ iv[choice]
                                 ^ ButtshockFirmwarePatcherCore.KEYS[choice];
      decrypted_firmware.push(output);
      iv[choice] = byte;
    });
    return decrypted_firmware;
  }

  applyPatches(patches) {
    // if (this.version == "unknown") {
    //   throw Error("Cannot patch unknown firmware version!");
    // }
    let modified_fw = this.firmware;
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
        for (let byte of replace_with) {
          modified_fw[replace_start] = byte;
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
          bytes = l
            .split('\t')[1]
            .trim()
            .split(' ')
            .map(map_parse);
        } catch (e) {
          continue;
        }
        for (let byte of bytes) {
          modified_fw[location] = byte;
          location += 1;
          patched += 1;
        }
      }
    }
    return modified_fw;
  }
}

module.exports = {
  ButtshockFirmwarePatcherCore: ButtshockFirmwarePatcherCore
};
