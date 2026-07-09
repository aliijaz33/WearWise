const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'cjs' and 'mjs' to the source extensions. This is required by packages
// such as @supabase/supabase-js whose main entry point is dist/index.cjs.
// Without 'cjs' in sourceExts, Metro cannot resolve the package and throws
// "Unable to resolve @supabase/supabase-js".
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx',
  'ts',
  'tsx',
  'cjs',
  'mjs',
];

// Enable package "exports" field resolution so Metro can resolve packages
// that ship conditional exports (e.g. @supabase/supabase-js react-native entry).
config.resolver.unstable_enablePackageExports = true;

// Prefer watchman for file watching to avoid EMFILE (too many open files)
// errors on macOS when using the default Node.js fs watcher.
config.watcher = {
  ...config.watcher,
  watchman: true,
  healthCheck: true,
};

module.exports = config;
