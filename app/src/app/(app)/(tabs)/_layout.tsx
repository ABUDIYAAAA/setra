import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { GlassView } from 'expo-glass-effect';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#71717A',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(255, 255, 255, 0.12)',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0, 0, 0, 0.94)',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <GlassView
              glassEffectStyle="regular"
              colorScheme="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0, 0, 0, 0.94)' },
              ]}
            />
          ),
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
              color={focused ? '#FFFFFF' : '#71717A'}
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
              color={focused ? '#FFFFFF' : '#71717A'}
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
              color={focused ? '#FFFFFF' : '#71717A'}
            />
          ),
        }}
      />
    </Tabs>
  );
}


