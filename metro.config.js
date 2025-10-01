const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolve import.meta issues on web
config.resolver.unstable_enablePackageExports = false;

// Source extensions for better compatibility
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
];

// Resolve aliases for missing modules  
const { resolve } = require('metro-resolver');
const path = require('path');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Disable HMR and async-require on web to avoid compatibility issues
  if (platform === 'web') {
    const blockedModules = [
      'metro-runtime/private/modules/HMRClient',
      '@expo/metro/metro-runtime/modules/HMRClient',
      'metro-runtime',
    ];
    
    // Check if module should be blocked
    if (blockedModules.includes(moduleName) ||
        moduleName.includes('HMRClient') ||
        moduleName.includes('/hmr') ||
        moduleName.includes('async-require')) {
      return {
        type: 'empty',
      };
    }
  }
  
  // Disable worklets on web (causes serialization errors)
  if (platform === 'web' && (moduleName.includes('react-native-worklets') || moduleName.includes('reanimated'))) {
    return {
      type: 'empty',
    };
  }
  
  // Use default resolver
  return resolve(context, moduleName, platform);
};

// Transformer options for better web compatibility
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;

