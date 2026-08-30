const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@features': path.resolve(__dirname, 'src/features'),
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@navigation': path.resolve(__dirname, 'src/navigation'),
  '@services': path.resolve(__dirname, 'src/services'),
};

module.exports = config;
