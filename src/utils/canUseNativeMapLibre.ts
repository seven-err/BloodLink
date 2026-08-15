import { TurboModuleRegistry } from 'react-native';

/**
 * MapLibre native modules are only present in custom/dev builds, not Expo Go.
 * Use TurboModuleRegistry.get (not getEnforcing) so missing modules return null.
 */
export const canUseNativeMapLibre = (): boolean => {
  try {
    return TurboModuleRegistry.get('MLRNCameraModule') != null;
  } catch {
    return false;
  }
};
