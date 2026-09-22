// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web backend (wa-sqlite) loads a .wasm binary at runtime.
// Metro doesn't treat .wasm as a bundleable asset by default, which breaks
// `expo export --platform web` with "Unable to resolve module
// .../wa-sqlite.wasm" — see docs/build-web.md.
config.resolver.assetExts.push('wasm');

module.exports = config;
