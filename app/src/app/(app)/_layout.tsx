import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#080A10',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. Home (Leftmost) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={focused ? '#FFFFFF' : '#64748B'}
            />
          ),
        }}
      />

      {/* 2. Workout (Middle) */}
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'barbell' : 'barbell-outline'}
              size={23}
              color={focused ? '#FFFFFF' : '#64748B'}
            />
          ),
        }}
      />

      {/* 3. Profile (Rightmost) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={focused ? '#FFFFFF' : '#64748B'}
            />
          ),
        }}
      />

      {/* Hidden from tab bar */}
      <Tabs.Screen
        name="exercises"
        options={{
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: '#07090E' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          title: 'Exercise Library',
        }}
      />
    </Tabs>
  );
}
