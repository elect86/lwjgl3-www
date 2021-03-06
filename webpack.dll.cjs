'use strict';
const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  target: 'web',
  amd: false,
  devtool: 'cheap-module-source-map',
  entry: {
    vendor: {
      import: [
        // immediate dependencies
        '@emotion/css',
        'focus-trap',
        'history',
        'immer',
        'jszip',
        'lodash-es',
        'react',
        'react-dom',
        'react-error-overlay',
        'react-fast-compare',
        'react-router',
        'react-router-dom',
        'scheduler',
        'scroll-into-view-if-needed',
        'tabbable',
        'whatwg-fetch',
        // other
        'ansi-html',
        'ansi-regex',
        'html-entities',
      ],
    },
  },
  output: {
    path: path.resolve(__dirname, 'public/js'),
    filename: '[name].js',
    publicPath: '/js/',
    crossOriginLoading: 'anonymous',
    ecmaVersion: 5,
    library: '[name]',
  },
  resolve: {
    extensions: ['.tsx', '.jsx', '.ts', '.js', '.json'],
    alias: {
      // Use prebundled jszip that has smaller stream polyfill
      jszip: path.resolve(__dirname, `./node_modules/jszip/dist/jszip.js`),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new webpack.DllPlugin({
      // context: __dirname,
      // format: true,
      // entryOnly: true,
      entryOnly: false,
      name: '[name]',
      path: path.resolve(__dirname, 'public/js', 'vendor.manifest.json'),
    }),
  ],
};
