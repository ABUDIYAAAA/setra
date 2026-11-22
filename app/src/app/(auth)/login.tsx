import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { loginWithGoogle, setSessionTokens } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      // Pass redirectUrl as state so backend callback redirects directly back into mobile app
      const googleAuthUrl = await authApi.getGoogleUrl(redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const accessToken = (parsed.queryParams?.accessToken as string) || undefined;
        const refreshToken = (parsed.queryParams?.refreshToken as string) || undefined;
        const code = (parsed.queryParams?.code as string) || undefined;
        const idToken =
          (parsed.queryParams?.id_token as string) ||
          (parsed.queryParams?.idToken as string) ||
          undefined;

        if (accessToken && refreshToken) {
          await setSessionTokens(accessToken, refreshToken);
          return;
        }

        if (code || idToken) {
          await loginWithGoogle({ code, idToken });
          return;
        }
      }

      if (result.type === 'cancel') {
        // User cancelled popup
        return;
      }

      // If in dev simulator without active Google OAuth client ID, offer dev fallback
      Alert.alert(
        'Google OAuth Notice',
        'To complete live Google Sign-In, ensure your GOOGLE_CLIENT_ID is configured in the backend. Would you like to sign in with a demo Google account for testing?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign in with Demo Account',
            onPress: async () => {
              await loginWithGoogle({
                idToken: 'mock-valid-google-id-token',
              });
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Sign-in error:', err);
      Alert.alert('Sign-In Error', err?.message || 'Failed to authenticate with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        {/* Brand & Hero */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SETRA FITNESS</Text>
          </View>
          <Text style={styles.title}>Track. Train.{"\n"}Transform.</Text>
          <Text style={styles.subtitle}>
            Your comprehensive workout tracker with 700+ exercises, progressive overload, and intelligent analytics.
          </Text>
        </View>

        {/* Google-Only Action Area */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
            activeOpacity={0.85}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <View style={styles.googleButtonContent}>
                {/* Minimalist Google 'G' icon circle */}
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  heroSection: {
    marginTop: 60,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 50,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
  },
  actionSection: {
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  googleButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimerText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginTop: 18,
    lineHeight: 18,
  },
});
