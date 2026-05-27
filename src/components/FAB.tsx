import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FABProps {
  onPress: () => void;
  testID?: string;
}

export function FAB({ onPress, testID = 'fab' }: FABProps) {
  return (
    <TouchableOpacity testID={testID} style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.icon}>＋</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  icon: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
