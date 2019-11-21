'use strict';
const path = require('path');
const fsa = require('fs').promises;
const postcss = require('postcss');
const postcssConfig = require('../postcss.config.js');
const { argv } = require('yargs');

/*
  Entry point: /client/styles/index.css
  Output: /public/css/core.css

  CLI flags:
    --sourcemap generates source map
*/

const process = async () => {
  const sourcePath = path.resolve(__dirname, '../client/styles/index.css');
  const targetPath = path.resolve(__dirname, '../public/css/core.css');
  const sourceMapPath = path.resolve(__dirname, '../public/css/core.css.map');
  const SOURCEMAP = argv.sourcemap === true;

  console.log('Processing CSS');

  const source = await fsa.readFile(sourcePath);

  const result = await postcss(postcssConfig.plugins).process(source, {
    from: sourcePath,
    to: targetPath,
    map: SOURCEMAP
      ? {
          inline: false,
        }
      : false,
  });

  await fsa.writeFile(targetPath, result.css);
  if (result.map) {
    await fsa.writeFile(sourceMapPath, result.map);
  }
};

process();
