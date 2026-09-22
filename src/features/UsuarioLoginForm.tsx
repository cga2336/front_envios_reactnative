import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LoginFieldErrors, UsuarioLoginFormProps } from '../types';
import { loginUsuario } from '../services/usuarioApi';
import { googleAuthSession } from '../services/googleAuthApi';
import { useGoogleAuth } from './useGoogleAuth';

export function UsuarioLoginForm({ onSuccess, onRegisterPress, notice }: UsuarioLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const google = useGoogleAuth();

  const commonInputProps = {
    autoCorrect: false,
    spellCheck: false,
    autoComplete: 'off' as const,
    importantForAutofill: 'no' as const,
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function onSubmit() {
    setServerError('');

    const next: LoginFieldErrors = {};
    if (!emailValid) next.email = 'Correo inválido.';
    if (!password) next.password = 'Ingresa tu contraseña.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setSubmitting(true);
      const session = await loginUsuario(email.trim(), password);
      onSuccess(session);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Error inesperado al iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!google.result) return;

    let cancelled = false;
    async function run() {
      try {
        const data = await googleAuthSession({
          role: 'usuario',
          idToken: google.result?.idToken,
          accessToken: google.result?.accessToken,
          clientId: google.result?.clientId,
        });

        if (cancelled) return;
        if (data.usuario && data.token) {
          onSuccess({ token: data.token, usuario: data.usuario });
        }
      } catch (error) {
        if (!cancelled) {
          setServerError(error instanceof Error ? error.message : 'Error inesperado al iniciar sesión con Google.');
        }
      } finally {
        if (!cancelled) google.clear();
      }
    }
    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google.result]);

  function setField(key: keyof LoginFieldErrors, value: string) {
    if (key === 'email') setEmail(value);
    else setPassword(value);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const googleBusy = !!google.result;

  return (
    <ScrollView style={styles.card} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Inicio de sesión de usuario</Text>
      <Text style={styles.subtitle}>Ingresa tus credenciales para acceder a tu cuenta.</Text>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Pressable style={styles.googleBtn} disabled={googleBusy} onPress={google.prompt}>
        {googleBusy ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text style={styles.googleBtnText}>Continuar con Google</Text>
        )}
      </Pressable>
      {google.error ? <Text style={styles.error}>{google.error}</Text> : null}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o con correo y contraseña</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(v) => setField('email', v)}
      />
      {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={(v) => setField('password', v)}
      />
      {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      <Pressable style={[styles.submit, submitting && styles.submitDisabled]} disabled={submitting} onPress={onSubmit}>
        <Text style={styles.submitText}>{submitting ? 'Entrando...' : 'Iniciar sesión'}</Text>
      </Pressable>

      <View style={styles.registerRow}>
        <Text style={styles.registerText}>¿Aún no tienes cuenta?</Text>
        <Pressable onPress={onRegisterPress}>
          <Text style={styles.registerLink}>Regístrate aquí</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  content: { padding: 12, gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { color: '#475569', marginBottom: 8 },
  notice: { color: '#166534', backgroundColor: '#dcfce7', borderRadius: 8, padding: 8 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  googleBtnText: { color: '#0f172a', fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#64748b', fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  error: { color: '#b91c1c', marginBottom: 2 },
  serverError: { color: '#9f1239', backgroundColor: '#fff1f2', borderRadius: 8, padding: 8 },
  submit: { marginTop: 8, backgroundColor: '#1d4ed8', borderRadius: 10, padding: 12, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: 'white', fontWeight: '700' },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  registerText: { color: '#475569' },
  registerLink: { color: '#1d4ed8', fontWeight: '700' },
});