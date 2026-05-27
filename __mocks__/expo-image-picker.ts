export const launchCameraAsync = jest.fn().mockResolvedValue({ canceled: true, assets: [] });
export const launchImageLibraryAsync = jest.fn().mockResolvedValue({ canceled: true, assets: [] });
export const requestCameraPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const MediaTypeOptions = { Images: 'Images', Videos: 'Videos', All: 'All' };
export const UIImagePickerPresentationStyle = { FULL_SCREEN: 'fullScreen' };
