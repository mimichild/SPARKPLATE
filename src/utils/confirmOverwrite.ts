import { Alert } from 'react-native';

/** 同一天同一餐已有照片時，詢問使用者是否覆蓋舊照。確定 → true，取消 → false */
export function confirmOverwrite(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      '已存在一張照片了，請問需要覆蓋舊照嗎？',
      undefined,
      [
        { text: '取消', style: 'cancel', onPress: () => resolve(false) },
        { text: '確定', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });
}
