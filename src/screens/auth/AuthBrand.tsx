import { Image, StyleSheet, View } from 'react-native';

import logo from '@/assets/images/bloodlink-new-logo.png';

export function AuthBrand() {
  return (
    <View style={styles.brand}>
      <Image
        accessibilityLabel="BloodLink logo"
        resizeMode="contain"
        source={logo}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
  },
  logo: {
    height: 48,
    width: 160,
  },
});
