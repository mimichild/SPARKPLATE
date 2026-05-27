import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

type FlashListProps<T> = FlatListProps<T> & {
  estimatedItemSize?: number;
};

export function FlashList<T>({ estimatedItemSize: _est, ...props }: FlashListProps<T>) {
  return <FlatList {...props} />;
}
