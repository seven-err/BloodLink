import { StyleSheet, Text, View } from 'react-native';

export function SecurityFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.icon}>♜</Text>
      <View>
        <Text style={styles.title}>Your data is secure with us.</Text>
        <Text style={styles.subtitle}>We never share your information.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    marginTop: 22,
  },
  icon: {
    color: '#e50914',
    fontSize: 34,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '800',
  },
});
