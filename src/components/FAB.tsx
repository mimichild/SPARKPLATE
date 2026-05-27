import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

interface FABProps {
  onPress: () => void;
  testID?: string;
}

function CameraIcon() {
  return (
    <View style={cam.wrap}>
      {/* viewfinder bump */}
      <View style={cam.bump} />
      {/* camera body */}
      <View style={cam.body}>
        {/* outer lens ring */}
        <View style={cam.lensOuter}>
          {/* inner lens dot */}
          <View style={cam.lensInner} />
        </View>
      </View>
    </View>
  );
}

const cam = StyleSheet.create({
  wrap:       { width: 30, height: 24 },
  bump: {
    position: 'absolute', top: 0, left: 8,
    width: 10, height: 6,
    backgroundColor: '#fff',
    borderTopLeftRadius: 3, borderTopRightRadius: 3,
  },
  body: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 19,
    borderWidth: 2.5, borderColor: '#fff', borderRadius: 5,
    justifyContent: 'center', alignItems: 'center',
  },
  lensOuter: {
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2.5, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  lensInner: {
    width: 3, height: 3, borderRadius: 2,
    backgroundColor: '#fff',
  },
});

export function FAB({ onPress, testID = 'fab' }: FABProps) {
  const { fontColor } = useSettingsStore();
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.fab, { backgroundColor: fontColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <CameraIcon />
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
