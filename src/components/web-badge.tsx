import { version } from 'expo/package.json';
import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function WebBadge() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        Expo v{version}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
});
