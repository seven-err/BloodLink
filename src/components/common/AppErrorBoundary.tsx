import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii } from '@/constants/theme';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            BloodLink hit an unexpected error while starting. Retry, or reinstall the latest APK
            if this keeps happening.
          </Text>
          <Text style={styles.detail} selectable>
            {error.message}
          </Text>
          <Pressable onPress={this.handleRetry} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    gap: 12,
    padding: 20,
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  detail: {
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '700',
  },
});
