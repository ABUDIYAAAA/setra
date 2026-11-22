import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
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
        {/* Top Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="barbell-outline" size={26} color="#6366F1" />
          </View>
          <Text style={styles.brandName}>SETRA</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.headline}>Built for{"\n"}progression.</Text>
          <Text style={styles.subheadline}>
            Obsessive workout tracking, progressive overload logging, and 700+ exercises at your fingertips.
          </Text>

          {/* Value Props */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Full exercise catalog with technique guides</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Custom routines, rep ranges & cardio timers</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Zero-friction set logging and auto rest timers</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.googleButton, isSigningIn && styles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
            activeOpacity={0.85}
          >
            {isSigningIn ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#0F172A" />
                <Text style={styles.loadingButtonText}>Connecting to Google...</Text>
              </View>
            ) : (
              <View style={styles.googleButtonContent}>
                <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            Secure authentication powered by Google OAuth
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 32,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  heroSection: {
    marginTop: -20,
  },
  headline: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 50,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subheadline: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  featureText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  actionSection: {
    gap: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FCA5A5',
    lineHeight: 18,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.8,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  disclaimerText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
});
