// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add custom alias to let Metro know where "react-router/dom" should be resolved.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-router/dom': path.resolve(
    __dirname,
    'node_modules/react-router/esm/dom'
  ),
};

module.exports = config;
