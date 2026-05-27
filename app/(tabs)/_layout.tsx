import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#aaa',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: '今日紀錄',
          tabBarLabel: '今日',
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: '照片牆',
          tabBarLabel: '照片牆',
        }}
      />
      <Tabs.Screen
        name="filter"
        options={{
          title: '標籤',
          tabBarLabel: '標籤',
        }}
      />
    </Tabs>
  );
}
