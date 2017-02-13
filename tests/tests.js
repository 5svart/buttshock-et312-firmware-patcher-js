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

describe('ButtshockFirmwarePatcher Firmware Enc/Dec/Patching Checks', function() {
  let FW16_DECRYPTED_MD5 = 'fc557679b91f4d59a95a83e0dbf3a4c8';
  let M005_MD5 = '32a10e7986cd29adce47d1b39a07f536';
  let fw15;
  let fw16;

  before(function(done) {
    bs.ButtshockFirmwarePatcher.downloadFirmware().then(() => {
      fw15 = fs.readFileSync('firmware/312-15.upg');
      fw16 = fs.readFileSync('firmware/312-16.upg');
      done();
    });
  });

  it('should create successfully and with the correct version on getting a v1.5 firmware', function () {
    expect(new bs.ButtshockFirmwarePatcher(fw15)).to.have.property('version', '1.5 Encrypted');
  });
  it('should create successfully and with the correct version on getting a v1.6 firmware', function () {
    expect(new bs.ButtshockFirmwarePatcher(fw16)).to.have.property('version', '1.6 Encrypted');
  });
  it('should have matching md5 for decrypted 312-16 firmware', function() {
    let bfp = new bs.ButtshockFirmwarePatcher(fw16);
    bfp.decrypt();
    expect(bfp).to.have.property('version', '1.6 Encrypted');
    expect(bfp.firmware.length).to.equal(bs.ButtshockFirmwarePatcher.FIRMWARE_LENGTH);
    expect(md5(bfp.firmware)).to.equal(FW16_DECRYPTED_MD5);
  });
  it('should have matching md5 for reencryption of decrypted 312-16 firmware', function() {
    let bfp = new bs.ButtshockFirmwarePatcher(fw16);
    bfp.decrypt().encrypt();
    expect(bfp.firmware.length).to.equal(bs.ButtshockFirmwarePatcher.FIRMWARE_LENGTH);
    expect(md5(bfp.firmware)).to.equal(bs.ButtshockFirmwarePatcher.FIRMWARE_16_ENCRYPTED_MD5);
  });
  it('should have matching md5 for patching m005 over 312-16 firmware', function () {
    let bfp = new bs.ButtshockFirmwarePatcher(fw16);
    bfp.decrypt();
    let patches = fs.readFileSync('m005.fwpatch', 'ascii');
    expect(function () { bfp.patch(patches); }).to.not.throw();
    expect(bfp.firmware.length).to.equal(bs.ButtshockFirmwarePatcher.FIRMWARE_LENGTH);
    expect(md5(bfp.firmware)).to.equal(M005_MD5);
  });
});
