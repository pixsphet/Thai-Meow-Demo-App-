// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const backendPath = path.resolve(projectRoot, 'backend');

// Block backend directory from bundling
const backendBlockPattern = new RegExp(
  `^${backendPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`
);

config.resolver = {
  ...config.resolver,
  blockList: [
    backendBlockPattern,
    /.*[\\/]backend[\\/].*/,
  ],
  // Also use blacklistRE for older Metro versions
  blacklistRE: /.*[\\/]backend[\\/].*/,
};

// Set project root
config.projectRoot = projectRoot;

// Watch only src directory, not backend
const srcPath = path.resolve(projectRoot, 'src');
if (config.watchFolders) {
  config.watchFolders = config.watchFolders.filter(
    (folder) => !folder.includes('backend')
  );
}

// Exclude backend from file watching
if (!config.watcher) {
  config.watcher = {};
}
if (!config.watcher.ignored) {
  config.watcher.ignored = [];
}
config.watcher.ignored.push(
  /.*[\\/]backend[\\/].*/,
  /.*[\\/]\.git[\\/].*/,
);

module.exports = config;

