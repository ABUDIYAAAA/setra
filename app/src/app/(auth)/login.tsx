import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { loginWithGoogle, setSessionTokens } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);

    try {
      const redirectUrl = Linking.createURL('/auth/callback');
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

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to complete Google Sign-In. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        {/* Top Spacer to position elements gracefully */}
        <View style={styles.topSpacer} />

        {/* Branding Section */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandTitle}>SETRA</Text>
          <Text style={styles.brandSubtitle}>built for progressions</Text>
        </View>

        {/* Middle Action Section: Continue with Google & Legal */}
        <View style={styles.middleActionSection}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.googleButton, isSigningIn && styles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
            activeOpacity={0.88}
          >
            {isSigningIn ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#1F2937" />
                <Text style={styles.loadingButtonText}>Connecting to Google...</Text>
              </View>
            ) : (
              <View style={styles.googleButtonContent}>
                <Image
                  source={require('../../../assets/images/google-g.png')}
                  style={styles.googleLogo}
                  contentFit="contain"
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Extreme small legal text */}
          <Text style={styles.legalDisclaimer}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms & Conditions</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSpacer: {
    flex: 1,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 44,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  middleActionSection: {
    width: '100%',
    alignItems: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    flex: 1,
  },
  googleButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  legalDisclaimer: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  legalLink: {
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    flex: 1.4,
  },
});
