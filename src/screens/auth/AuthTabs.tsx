import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type AuthTabsProps = {
  active: 'login' | 'signup';
  onLogin: () => void;
  onSignup: () => void;
};

export function AuthTabs({ active, onLogin, onSignup }: AuthTabsProps) {
  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'login' }}
        style={styles.tab}
        onPress={onLogin}
      >
        <Text style={[styles.tabText, active === 'login' ? styles.activeText : null]}>Login</Text>
        <View style={[styles.indicator, active === 'login' ? styles.active : null]} />
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'signup' }}
        style={styles.tab}
        onPress={onSignup}
      >
        <Text style={[styles.tabText, active === 'signup' ? styles.activeText : null]}>
          Sign Up
        </Text>
        <View style={[styles.indicator, active === 'signup' ? styles.active : null]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: colors.primary,
  },
  activeText: {
    color: colors.primary,
  },
  indicator: {
    backgroundColor: colors.border,
    height: 1,
    marginTop: 16,
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    width: '100%',
  },
});
