import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailHeader } from '@/components/DetailHeader';
import { EntryForm, Field, TextField } from '@/components/EntryForm';
import { useSyncStatus } from '@/components/SyncProvider';
import { OptionChips, PrimaryButton, Rule } from '@/components/ui';
import { linkEmail, sendSignInCode, signOut, verifyCode } from '@/lib/supabase';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

type Mode = 'link' | 'join';
type Step = 'email' | 'code';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account } = useSyncStatus();

  const [mode, setMode] = useState<Mode>('link');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('email');
    setCode('');
    setError(null);
    setNotice(null);
  };

  const run = async (fn: () => Promise<void>, onOk?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onOk?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(
      () => (mode === 'link' ? linkEmail(email) : sendSignInCode(email)),
      () => {
        setStep('code');
        setNotice(`Enter the code we emailed to ${email.trim()}.`);
      }
    );

  const verify = () =>
    run(
      () => verifyCode(email, code, mode === 'link' ? 'link' : 'signin'),
      () => {
        reset();
        setEmail('');
        setNotice(
          mode === 'link'
            ? 'Email linked. Sign in with it on another device to sync.'
            : 'Signed in. Your data will sync shortly.'
        );
      }
    );

  const body = () => {
    if (!account.configured) {
      return (
        <View style={styles.infoBlock}>
          <Text style={[weight('semibold'), styles.h]}>Sync is off</Text>
          <Text style={[weight('medium'), styles.p]}>
            Steady is running local-only. Add your Supabase keys to a `.env` file (see `.env.example`) to enable
            cloud backup and multi-device sync.
          </Text>
        </View>
      );
    }

    if (account.loading) {
      return (
        <View style={{ paddingVertical: spacing.xxl }}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      );
    }

    if (account.email) {
      return (
        <View style={styles.infoBlock}>
          <Text style={[weight('semibold'), styles.h]}>Synced as {account.email}</Text>
          <Text style={[weight('medium'), styles.p]}>
            Your data is available on any device signed in with this email. Sign in with the same address on your
            other devices to sync them.
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton label="Sign out" onPress={() => run(() => signOut())} disabled={busy} />
          </View>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.infoBlock}>
          <Text style={[weight('semibold'), styles.h]}>Backed up to this device</Text>
          <Text style={[weight('medium'), styles.p]}>
            Entries are backed up under a private device account. To use Steady on another device, link an email
            here — then join with it on the other device.
          </Text>
        </View>
        <Rule />

        <View style={styles.formBlock}>
          <EntryForm
            onSubmit={step === 'email' ? sendCode : verify}
            disabled={busy || (step === 'email' ? !EMAIL_RE.test(email.trim()) : code.trim().length < 4)}
            submitLabel={
              step === 'email' ? (mode === 'link' ? 'Send link code' : 'Send sign-in code') : 'Verify code'
            }
          >
            <Field label="What do you want to do?">
              <OptionChips
                options={['link', 'join'] as const}
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  reset();
                }}
              />
              <Text style={[weight('medium'), styles.hint]}>
                {mode === 'link'
                  ? 'Link an email to this device so others can join it.'
                  : 'Join an account you already linked on another device.'}
              </Text>
            </Field>

            <Field label="Link an email">
              <TextField value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
            </Field>

            {step === 'code' ? (
              <Field label="6-digit code">
                <TextField value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" letterSpaced />
              </Field>
            ) : null}
          </EntryForm>

          <Text style={[weight('medium'), styles.footnote]}>
            Sync is last-write-wins: local writes queue and push, remote changes pull down, deletes propagate as
            tombstones.
          </Text>

          {step === 'code' ? (
            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton label="Use a different email" onPress={reset} disabled={busy} />
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'android' ? 'height' : undefined}
    >
      <DetailHeader title="Account & sync" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {busy ? (
          <View style={{ paddingTop: spacing.md, alignItems: 'flex-start', paddingHorizontal: spacing.lg }}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
        ) : null}
        {notice ? (
          <Text style={[weight('semibold'), styles.notice, { color: theme.colors.text }]}>{notice}</Text>
        ) : null}
        {error ? (
          <Text style={[weight('semibold'), styles.notice, { color: theme.colors.accentText }]}>{error}</Text>
        ) : null}
        {body()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  infoBlock: { padding: spacing.lg, backgroundColor: theme.colors.surface, gap: spacing.xs },
  h: { fontSize: 13, color: theme.colors.text },
  p: { fontSize: 13, lineHeight: 19, color: theme.colors.textMuted },
  formBlock: { padding: spacing.lg, gap: spacing.md },
  hint: { fontSize: 11, lineHeight: 16, color: theme.colors.textMuted, marginTop: spacing.sm },
  footnote: { fontSize: 11.5, lineHeight: 16, color: theme.colors.textFaint },
  notice: { fontSize: 13, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
