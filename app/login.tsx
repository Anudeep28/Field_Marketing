import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow } from '../constants/theme';
import Button from '../components/ui/Button';
import { authenticateUser, toUser, loadRegisteredUsers } from '../utils/userDatabase';
import { useIsMobile } from '../utils/responsive';

export default function LoginScreen() {
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loadRegisteredUsers();
      const registeredUser = authenticateUser(email, password);
      if (!registeredUser) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const user = toUser(registeredUser);
      await login(user);
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Login failed:', e);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Decorative gradient-feel orbs */}
      <View style={styles.orbTop} pointerEvents="none" />
      <View style={styles.orbBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sp.xxl, paddingVertical: sp.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          {/* Brand header */}
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="location" size={22} color={Colors.textOnPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>FieldPulse</Text>
              <Text style={styles.brandTag}>Marketing Visit Tracker</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.formTitle, { fontSize: fs.xxl }]}>Welcome back</Text>
          <Text style={[styles.formSubtitle, { fontSize: fs.sm }]}>Sign in to continue to your dashboard</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                placeholder="you@fieldpulse.in"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="Enter password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!email.trim() || !password.trim()}
            fullWidth
            size="lg"
            style={styles.loginButton}
          />
        </View>

        <Text style={styles.footer}>Powered by Eneru (OPC)</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    opacity: 0.35,
  },
  orbBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
    opacity: 0.28,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Shadow.xl,
  },
  cardMobile: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  brandName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  brandTag: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xl,
  },
  formTitle: {
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: Spacing.lg,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    // @ts-ignore — web-only, harmless on native
    outlineStyle: 'none' as any,
  },
  eyeBtn: {
    padding: Spacing.md,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: Spacing.xxl,
    letterSpacing: 0.4,
  },
});
