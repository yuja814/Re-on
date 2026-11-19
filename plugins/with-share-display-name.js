const { withXcodeProject } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
const plist = require('@expo/plist').default;

// Keep the generated extension target name intact, but show the app name in the share sheet.
module.exports = (config) => withXcodeProject(config, (mod) => {
  const file = path.join(mod.modRequest.platformProjectRoot, 'expo-sharing-extension', 'Info.plist');
  const info = plist.parse(fs.readFileSync(file, 'utf8'));
  info.CFBundleDisplayName = 'Re:on';
  fs.writeFileSync(file, plist.build(info));
  return mod;
});
