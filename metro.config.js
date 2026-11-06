const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const existing = config.resolver.blockList;
// Dotenv is loaded by Expo/the launch script, never as JavaScript modules.
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  /[/\\]\.env(?:\.[^/\\]*)?$/,
];

module.exports = config;
