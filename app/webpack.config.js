const webpack = require('webpack');
const path = require('path');

const autoImportGlobalComponentsPlugin = require('./plugin/index');

const config = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.ts(x)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new autoImportGlobalComponentsPlugin({
      clean: false,
      debug: true,
      rules: [
        {
          folders: ['./src/Modules/'],
          entries: ['./src/index.tsx']
        },
      ],
    })
  ],
  resolve: {
    extensions: [
      '.tsx',
      '.ts',
      '.js'
    ]
  }
};

module.exports = config;