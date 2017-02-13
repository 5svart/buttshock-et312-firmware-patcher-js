'use strict';

class ButtshockFirmwareUploaderApp {

  constructor() {
    this.array_buf = undefined;
    this.file = undefined;
    this.patched_file = undefined;
  }

  read(e) {
    let file = document.getElementById('firmware_file').files[0];
    let r = new FileReader();
    r.readAsArrayBuffer(file);
    r.onload = () => { console.log("Read file!");
                       this.file = new Uint8Array(r.result); };
    e.stopPropagation();
    e.preventDefault();
  }

  patch() {
    let patcher = new bs.ButtshockFirmwarePatcherCore(this.file);
    patcher.decrypt();
    console.log("decrypted file!");

  }

  download() {
  }
}

var bf = new ButtshockFirmwareUploaderApp();

