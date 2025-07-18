const path = require('path');

module.exports = {
  mode: 'production',
  entry: './extension/popup.tsx',
  output: {
    path: path.resolve(__dirname, '.'),
    filename: 'popup.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  target: 'web',
}; 