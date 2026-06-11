import React, { useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useSettingsStore } from '@/stores/settingsStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  visible: boolean;
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
}

export function CameraLaunchModal({ visible, onPhotoTaken, onClose }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);
  const autoSavePhoto = useSettingsStore((s) => s.autoSavePhoto);

  async function handleCapture() {
    if (taking || !cameraRef.current) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) return;
      if (autoSavePhoto) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
      onPhotoTaken(photo.uri);
    } finally {
      setTaking(false);
    }
  }

  async function handleLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoTaken(result.assets[0].uri);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>

        {/* ── 1:1 相機預覽區 ── */}
        <View style={styles.cameraBox}>
          {!permission ? (
            <ActivityIndicator color="#fff" size="large" style={styles.loading} />
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>需要相機權限才能拍照</Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                <Text style={styles.permissionBtnText}>授予權限</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
            />
          )}
        </View>

        {/* ── X 關閉按鈕 ── */}
        <TouchableOpacity
          testID="camera-launch-close"
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* ── 底部控制列 ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            testID="camera-launch-library"
            style={styles.libraryBtn}
            onPress={handleLibrary}
          >
            <Text style={styles.libraryText}>相簿</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="camera-launch-shutter"
            style={styles.shutter}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={taking}
          >
            <View style={[styles.shutterInner, taking && { opacity: 0.5 }]} />
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },

  cameraBox: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    overflow: 'hidden',
    alignSelf: 'center',
  },

  loading: { flex: 1, alignSelf: 'center' },

  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  permissionText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  permissionBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  permissionBtnText: { fontSize: 16, fontWeight: '600', color: '#111' },

  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { fontSize: 18, color: '#fff', fontWeight: '600' },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  libraryBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },

  placeholder: { width: 64 },
});
