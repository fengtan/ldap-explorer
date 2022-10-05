//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  // VS Code extensions run in a Node.js-context https://webpack.js.org/configuration/node/
  target: 'node',
  // This leaves the source code as close as possible to the original (when packaging we set this to 'production')
  mode: 'none',
  // The entry point of this extension https://webpack.js.org/configuration/entry-context/
  entry: './src/extension.ts',
  output: {
    // The bundle is stored in the 'dist' folder (check package.json) https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    // The vscode-module is created on-the-fly and must be excluded https://webpack.js.org/configuration/externals/
    vscode: 'commonjs vscode',
    // Do not bundle npm dependencies
    // webpack not supported by ldapjs, see https://github.com/ldapjs/node-ldapjs/issues/421
    ldapjs: 'commonjs ldapjs'
  },
  resolve: {
    // Support reading TypeScript and JavaScript files https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    // Enables logging required for problem matchers
    level: "log",
  },
};
module.exports = [ extensionConfig ];
