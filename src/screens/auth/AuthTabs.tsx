import { Pressable, StyleSheet, Text, View } from 'react-native';

type AuthTabsProps = {
  active: 'login' | 'signup';
  onLogin: () => void;
  onSignup: () => void;
};

export function AuthTabs({ active, onLogin, onSignup }: AuthTabsProps) {
  return (
    <View style={styles.tabs}>
      <Pressable style={styles.tab} onPress={onLogin}>
        <Text style={[styles.tabText, active === 'login' ? styles.activeText : null]}>
          Login
        </Text>
        <View style={[styles.indicator, active === 'login' ? styles.active : null]} />
      </Pressable>
      <Pressable style={styles.tab} onPress={onSignup}>
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
    backgroundColor: '#e50914',
  },
  activeText: {
    color: '#e50914',
  },
  indicator: {
    backgroundColor: '#d8d8d8',
    height: 2,
    marginTop: 16,
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabText: {
    color: '#71717a',
    fontSize: 18,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    width: '100%',
  },
});
