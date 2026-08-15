const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs', 'cjs');

const googleSignInMarker = `${path.sep}@react-native-google-signin${path.sep}google-signin${path.sep}`;
const googleSignInShim = path.resolve(__dirname, 'src/shims/googleSignInPackage.js');
const defaultResolveRequest = config.resolver.resolveRequest;

const resolveWithDefault = (context, moduleName, platform) => {
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

const tryResolve = (context, moduleName, platform) => {
  try {
    return resolveWithDefault(context, moduleName, platform);
  } catch {
    return null;
  }
};

/**
 * 1) Point the package entry at a shim that skips GoogleSigninButton (broken codegen path).
 * 2) Fix ESM extensionless relative imports inside the package by retrying with .js/.ts.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@react-native-google-signin/google-signin') {
    return {
      type: 'sourceFile',
      filePath: googleSignInShim,
    };
  }

  const isGoogleSignInOrigin = context.originModulePath?.includes(googleSignInMarker);
  const isExtensionlessRelative =
    moduleName.startsWith('./') || moduleName.startsWith('../');

  if (isGoogleSignInOrigin && isExtensionlessRelative && !path.extname(moduleName)) {
    return (
      tryResolve(context, `${moduleName}.js`, platform) ??
      tryResolve(context, `${moduleName}.ts`, platform) ??
      resolveWithDefault(context, moduleName, platform)
    );
  }

  return resolveWithDefault(context, moduleName, platform);
};

module.exports = config;
