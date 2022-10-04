//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context https://webpack.js.org/configuration/node/
  mode: 'none', // This leaves the source code as close as possible to the original (when packaging we set this to 'production')
  entry: './src/extension.ts', // The entry point of this extension https://webpack.js.org/configuration/entry-context/
  output: {
    // The bundle is stored in the 'dist' folder (check package.json) https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // The vscode-module is created on-the-fly and must be excluded https://webpack.js.org/configuration/externals/
    // Modules added here also need to be added in the .vscodeignore file
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
    level: "log", // Enables logging required for problem matchers
  },
};
module.exports = [ extensionConfig ];
