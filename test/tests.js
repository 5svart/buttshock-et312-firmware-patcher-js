const chai = require('chai');
const expect = chai.expect;
const bs = require('../lib/buttshock-firmware-patcher.js');
const fs = require('fs');
const md5 = require('md5');

describe('ButtshockFirmwarePatcher Construction', function() {
  it('should throw on missing file parameter to constructor', function() {
    expect(function() { new bs.ButtshockFirmwarePatcher(); }).to.throw('Must have a firmware buffer to work with!');
  });
  it('should throw on wrong firmware array length', function() {
    expect(function() { new bs.ButtshockFirmwarePatcher([]); }).to.throw('Firmware length must be 15872 bytes!');
  });
  it('should create successfully on getting null array of proper length', function () {
    expect(function() { new bs.ButtshockFirmwarePatcher(Array(bs.ButtshockFirmwarePatcher.FIRMWARE_LENGTH).fill(0));}).to.not.throw();
  });
});

describe('ButtshockFirmwarePatcher Firmware Checks', function() {
  // TODO: Fetch firmware!
  let fw15 = fs.readFileSync('firmware/312-15.upg');
  let fw16 = fs.readFileSync('firmware/312-16.upg');
  let FW16_MD5 = 'fc557679b91f4d59a95a83e0dbf3a4c8';
  let bfp_enc = new bs.ButtshockFirmwarePatcher(fw16);
  let decrypted_fw = bfp_enc.decrypt();
  let bfp_dec = new bs.ButtshockFirmwarePatcher(decrypted_fw);
  let encrypted_fw = bfp_dec.encrypt();
  it('should create successfully and with the correct version on getting a v1.5 firmware', function () {
    expect(new bs.ButtshockFirmwarePatcher(fw15)).to.have.property('version', '1.5 Encrypted');
  });
  it('should create successfully and with the correct version on getting a v1.6 firmware', function () {
    expect(new bs.ButtshockFirmwarePatcher(fw16)).to.have.property('version', '1.6 Encrypted');
  });
  it('should have matching md5 for decrypted 312-16 firmware', function() {
    expect(bfp_enc).to.have.property('version', '1.6 Encrypted');
    expect(decrypted_fw.length).to.equal(bs.ButtshockFirmwarePatcher.FIRMWARE_LENGTH);
    expect(md5(decrypted_fw)).to.equal(FW16_MD5);
  });
  it('should have matching md5 for reencryption of decrypted 312-16 firmware', function() {
    expect(bfp_dec).to.have.property('version', 'unknown');
    expect(encrypted_fw.length).to.equal(bs.ButtshockFirmwarePatcher.FIRMWARE_LENGTH);
    expect(md5(encrypted_fw)).to.equal(bs.ButtshockFirmwarePatcher.FIRMWARE_16_ENCRYPTED_MD5);
  });
});
