import { Image, StyleSheet, Text, View } from 'react-native';

import logo from '@/assets/logo-v2.jpg';

export function AuthBrand() {
  return (
    <View style={styles.brand}>
      <Image
        resizeMode="contain"
        source={logo}
        style={styles.logo}
      />
      <View style={styles.wordmark}>
        <Text style={[styles.word, styles.red]}>Blood</Text>
        <Text style={styles.word}>Link</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    height: 142,
    width: 190,
  },
  red: {
    color: '#e50914',
  },
  word: {
    color: '#222',
    fontSize: 38,
    fontWeight: '900',
  },
  wordmark: {
    flexDirection: 'row',
  },
});
