import React from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Meal } from '@/types';

const { width, height } = Dimensions.get('window');

interface PhotoViewerProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
}

export function PhotoViewer({ visible, meal, onClose }: PhotoViewerProps) {
  if (!meal?.photo) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Image
          source={{ uri: meal.photo.detailUri }}
          style={styles.image}
          resizeMode="contain"
        />
        <TouchableOpacity testID="photo-viewer-close" style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  image: { width, height: height * 0.8 },
  closeBtn: {
    position: 'absolute', top: 52, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
