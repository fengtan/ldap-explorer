// @ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'webworker', // vscode extensions run in webworker context for VS Code web https://webpack.js.org/configuration/target/#target

  entry: './src/extension.ts', // the entry point of this extension https://webpack.js.org/configuration/entry-context/
  output: {
    // The bundle is stored in the 'dist' folder (check package.json) https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // The vscode-module is created on-the-fly and must be excluded https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // Support reading TypeScript and JavaScript files https://github.com/TypeStrong/ts-loader
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.js'],
    alias: { },
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    }
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
  }
};
module.exports = config;
