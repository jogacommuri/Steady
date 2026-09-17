import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryForm, Field, PrimaryButton, TextField } from '@/components/EntryForm';
import { Card, ChipGroup } from '@/components/ui';
import { useSyncStatus } from '@/components/SyncProvider';
import {
  linkEmail,
  sendSignInCode,
  signOut,
  verifyCode,
} from '@/lib/supabase';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

type Mode = 'link' | 'join';
type Step = 'email' | 'code';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { account } = useSyncStatus();

  const [mode, setMode] = useState<Mode>('link');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accent = colors.plum;

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
        <Card>
          <Text style={[styles.h, { color: colors.text }]}>Sync is off</Text>
          <Text style={[styles.p, { color: colors.textMuted }]}>
            Steady is running local-only. Add your Supabase keys to a `.env`
            file (see `.env.example`) to enable cloud backup and multi-device
            sync.
          </Text>
        </Card>
      );
    }

    if (account.loading) {
      return (
        <View style={{ paddingVertical: spacing.xxl }}>
          <ActivityIndicator color={accent} />
        </View>
      );
    }

    if (account.email) {
      return (
        <Card style={{ gap: spacing.md }}>
          <Text style={[styles.h, { color: colors.text }]}>
            Synced as {account.email}
          </Text>
          <Text style={[styles.p, { color: colors.textMuted }]}>
            Your data is available on any device signed in with this email. Sign
            in with the same address on your other devices to sync them.
          </Text>
          <PrimaryButton
            label="Sign out"
            accent={colors.danger}
            disabled={busy}
            onPress={() => run(() => signOut())}
          />
        </Card>
      );
    }

    // Anonymous (device-only) account.
    return (
      <View style={{ gap: spacing.lg }}>
        <Card>
          <Text style={[styles.h, { color: colors.text }]}>
            Backed up to this device
          </Text>
          <Text style={[styles.p, { color: colors.textMuted }]}>
            Your entries are backed up under a private device account. To use
            Steady on another device, link an email here — then sign in with it
            on the other device.
          </Text>
        </Card>

        <EntryForm
          accent={accent}
          submitLabel={
            step === 'email'
              ? mode === 'link'
                ? 'Send link code'
                : 'Send sign-in code'
              : 'Verify code'
          }
          disabled={
            busy ||
            (step === 'email' ? !EMAIL_RE.test(email.trim()) : code.trim().length < 4)
          }
          onSubmit={step === 'email' ? sendCode : verify}
        >
          <Field label="What do you want to do?">
            <ChipGroup<Mode>
              options={['link', 'join']}
              value={mode}
              accent={accent}
              onChange={(m) => {
                setMode(m);
                reset();
              }}
            />
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {mode === 'link'
                ? 'Link an email to this device so others can join it.'
                : 'Join an account you already linked on another device.'}
            </Text>
          </Field>

          <Field label="Email">
            <TextField
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
          </Field>

          {step === 'code' ? (
            <Field label="6-digit code">
              <TextField
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
              />
            </Field>
          ) : null}
        </EntryForm>

        {step === 'code' ? (
          <PrimaryButton
            label="Use a different email"
            accent={colors.surfaceAlt}
            disabled={busy}
            onPress={reset}
          />
        ) : null}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.xl,
        gap: spacing.md,
      }}
    >
      {busy ? <ActivityIndicator color={accent} /> : null}
      {notice ? (
        <Text style={[styles.notice, { color: colors.sage }]}>{notice}</Text>
      ) : null}
      {error ? (
        <Text style={[styles.notice, { color: colors.danger }]}>{error}</Text>
      ) : null}
      {body()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 16, fontWeight: '700', marginBottom: spacing.xs },
  p: { fontSize: 14, lineHeight: 20 },
  hint: { fontSize: 12, lineHeight: 16, marginTop: spacing.xs },
  notice: { fontSize: 14, fontWeight: '600' },
});
