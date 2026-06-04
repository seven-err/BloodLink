import { StyleSheet, Text, View } from 'react-native';

export function AuthDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>or continue with email</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    backgroundColor: '#d7d7d7',
    flex: 1,
    height: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginVertical: 8,
  },
  text: {
    color: '#747681',
    fontSize: 14,
  },
});
