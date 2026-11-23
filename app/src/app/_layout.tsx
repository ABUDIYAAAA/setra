import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments, ThemeProvider, DarkTheme } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SystemUI from 'expo-system-ui';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { RoutineDraftProvider } from '../context/RoutineDraftContext';

// Ensure root native window background is pure black immediately
SystemUI.setBackgroundColorAsync('#000000').catch(() => {});

const PureBlackDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#6366F1',
  },
};

// Configure TanStack QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 1,
    },
  },
});

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated -> redirect to login screen
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated -> redirect to main app home screen ('/')
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ThemeProvider value={PureBlackDarkTheme}>
      <Slot />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoutineDraftProvider>
          <AuthGuard />
        </RoutineDraftProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
