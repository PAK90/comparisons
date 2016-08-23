'use strict';

const webpack = require('webpack');
const path = require('path');
const loaders = require('./webpack.loaders');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || "3333";

const config = {}

config.entry = []

if (process.env.NODE_ENV !== 'production') {
  config.devtool = process.env.WEBPACK_DEVTOOL || 'source-map';
  config.entry.push(`webpack-dev-server/client?http://${HOST}:${PORT}`); // WebpackDevServer host and port
  config.entry.push('webpack/hot/only-dev-server');
}

config.entry.push(path.join(__dirname, './src/index.js')); // Your app's entry point

config.output = {
  path: path.join(__dirname, 'public'),
  filename: 'bundle.js'
}

config.resolve = {
  extensions: ['', '.js', '.jsx']
}

config.module = {
  loaders
}

config.devServer = {
  contentBase: "./public",
  noInfo: true, //  --no-info option
  hot: true,
  inline: true,
  port: PORT,
  host: HOST
}

config.plugins = [
  new webpack.NoErrorsPlugin(),
  new webpack.HotModuleReplacementPlugin(),
  new CopyWebpackPlugin([
    { from: './index.html' },
    { from: './favicon-16x16.png' },
    { from: './favicon-32x32.png' }
  ])
]

module.exports = config;
