import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    code?: string;
    error?: string;
  }>();
  const { setSessionTokens, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function handleDeepLink() {
      try {
        if (params.accessToken && params.refreshToken) {
          await setSessionTokens(params.accessToken, params.refreshToken);
          router.replace('/');
          return;
        }

        if (params.code) {
          await loginWithGoogle({ code: params.code });
          router.replace('/');
          return;
        }

        // If no tokens or error, go back to login
        router.replace('/(auth)/login');
      } catch (err) {
        console.error('Deep link callback error:', err);
        router.replace('/(auth)/login');
      }
    }

    handleDeepLink();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#94A3B8',
    marginTop: 14,
    fontSize: 15,
  },
});
