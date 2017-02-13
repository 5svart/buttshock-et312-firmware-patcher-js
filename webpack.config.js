module.exports = {
  entry: './lib/buttshock-firmware-patcher-core.js',
  output: {
    path: './html',
    filename: 'patcher.js',
    libraryTarget: 'var',
    library: 'bs'
  }
};
