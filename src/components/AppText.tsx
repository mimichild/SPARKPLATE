import React from 'react';
import { Text, TextProps } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

// Themed Text: fontColor is applied as base, explicit style.color overrides it.
// Use <Text> directly (not AppText) for white/overlay text that must not change.
export function AppText({ style, ...props }: TextProps) {
  const { fontColor } = useSettingsStore();
  return <Text style={[{ color: fontColor }, style]} {...props} />;
}
