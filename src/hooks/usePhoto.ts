import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

interface UsePhotoReturn {
  takePicture: () => Promise<string | null>;
  pickFromLibrary: () => Promise<string | null>;
  sharePhoto: (uri: string) => Promise<void>;
  saveToDevice: (uri: string) => Promise<void>;
}

export function usePhoto(): UsePhotoReturn {
  const takePicture = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }, []);

  const pickFromLibrary = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }, []);

  const sharePhoto = useCallback(async (uri: string): Promise<void> => {
    await Sharing.shareAsync(uri);
  }, []);

  const saveToDevice = useCallback(async (uri: string): Promise<void> => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return;
    await MediaLibrary.saveToLibraryAsync(uri);
  }, []);

  return { takePicture, pickFromLibrary, sharePhoto, saveToDevice };
}
