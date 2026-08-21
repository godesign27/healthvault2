const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = withNativeWind(getDefaultConfig(projectRoot), { input: './global.css' });

// Avoid watching the entire monorepo (Vite web app under ./src, etc.); that commonly triggers
// `EMFILE: too many open files` on macOS when Watchman is not installed.
config.watchFolders = [
  projectRoot,
  path.join(monorepoRoot, 'packages', 'types'),
  path.join(monorepoRoot, 'packages', 'api-client'),
];

// npm workspaces can leave multiple compatible Reacts on disk; Metro may load more than one →
// "Invalid hook call" / `useId` of null. Resolve `react` to a single physical package.
const reactRoot = path.dirname(
  require.resolve('react/package.json', { paths: [projectRoot] })
);
const reactNativeRoot = path.dirname(
  require.resolve('react-native/package.json', { paths: [projectRoot] })
);
const safeAreaContextRoot = path.dirname(
  require.resolve('react-native-safe-area-context/package.json', {
    paths: [projectRoot],
  })
);
const gestureHandlerRoot = path.dirname(
  require.resolve('react-native-gesture-handler/package.json', {
    paths: [projectRoot],
  })
);
const screensRoot = path.dirname(
  require.resolve('react-native-screens/package.json', { paths: [projectRoot] })
);
const reanimatedRoot = path.dirname(
  require.resolve('react-native-reanimated/package.json', { paths: [projectRoot] })
);
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: reactRoot,
  'react-native': reactNativeRoot,
  'react-native-safe-area-context': safeAreaContextRoot,
  'react-native-gesture-handler': gestureHandlerRoot,
  'react-native-screens': screensRoot,
  'react-native-reanimated': reanimatedRoot,
};

// Pin JSX runtimes to the same physical `react` as `extraNodeModules` (Metro can still split
// `react` vs `react/jsx-runtime` across copies in some monorepo layouts).
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName === 'react/jsx-runtime' ||
    moduleName === 'react/jsx-dev-runtime'
  ) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
    };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// NativeWind's css-interop Metro shim reads `config.cssInterop_transformerPath` on the object
// Metro passes into the worker, but `withCssInterop` only sets `config.transformer.*`. If the
// root property is missing, the shim falls back to stock `metro-transform-worker` instead of
// Expo's fork — Babel never inlines `EXPO_ROUTER_APP_ROOT` in `expo-router/_ctx.*` and you get
// the red-screen `require.context` / `EXPO_ROUTER_APP_ROOT` error.
config.cssInterop_transformerPath = require.resolve(
  '@expo/metro-config/build/transform-worker/transform-worker'
);

module.exports = config;
