const path = require('path');

const autoImportGlobalComponentsPlugin = require('./plugin/index');
const dir = path.resolve(__dirname, '');

const config = {
  entry: './app/index.tsx',
  output: {
    path: dir + '/dist',
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
      clean: true,
      debug: false,
      rules: [
        {
          folders: ['./app/Modules/'],
          entries: ['./app/index.tsx']
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