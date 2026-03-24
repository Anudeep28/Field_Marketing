import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { Colors, Spacing, MobileSpacing, FontSize, MobileFontSize, BorderRadius, Shadow } from '../constants/theme';
import Button from '../components/ui/Button';
import { showAlert } from '../utils/alert';
import { authenticateUser, toUser } from '../utils/userDatabase';
import { useIsMobile } from '../utils/responsive';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@fieldpulse.in', password: 'admin123' },
  { label: 'Agent', email: 'arjun@fieldpulse.in', password: 'agent123' },
];

export default function LoginScreen() {
  const login = useStore((s) => s.login);
  const clients = useStore((s) => s.clients);
  const seedData = useStore((s) => s.seedSampleData);
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
      const registeredUser = authenticateUser(email, password);
      if (!registeredUser) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const user = toUser(registeredUser);
      await login(user);

      // Seed sample data for first-time users
      if (clients.length === 0) {
        await seedData(user.id);
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Login failed:', e);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account: typeof DEMO_ACCOUNTS[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const isMobile = useIsMobile();
  const sp = isMobile ? MobileSpacing : Spacing;
  const fs = isMobile ? MobileFontSize : FontSize;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sp.xxl, paddingVertical: sp.xxxl * 2 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>📍</Text>
          </View>
          <Text style={styles.appName}>FieldPulse</Text>
          <Text style={styles.tagline}>Marketing Visit Tracker</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.formTitle, { fontSize: fs.xxl }]}>Sign In</Text>
          <Text style={[styles.formSubtitle, { fontSize: fs.md }]}>Enter your credentials to continue</Text>

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

          {/* Demo Quick Login */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Quick Demo Login</Text>
            <View style={styles.demoRow}>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.label}
                  style={styles.demoChip}
                  onPress={() => fillDemo(acc)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoChipText}>{acc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Powered by Eneru (OPC)</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    ...Shadow.lg,
  },
  formTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
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
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
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
  },
  eyeBtn: {
    padding: Spacing.md,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  demoSection: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.xl,
  },
  demoTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  demoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  demoChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.xxl,
    letterSpacing: 0.3,
  },
});
