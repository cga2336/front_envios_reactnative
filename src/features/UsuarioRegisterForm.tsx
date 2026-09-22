import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FieldErrorMap, RegisterUsuarioPayload, UsuarioRegisterFormProps, UsuarioSession } from '../types';
import { registerUsuario } from '../services/usuarioApi';
import { googleAuthSession } from '../services/googleAuthApi';
import { useGoogleAuth } from './useGoogleAuth';

export function UsuarioRegisterForm({ onSuccess }: UsuarioRegisterFormProps) {
  type Errors = FieldErrorMap<keyof RegisterUsuarioPayload>;

  const [form, setForm] = useState<RegisterUsuarioPayload>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const google = useGoogleAuth();

  const commonInputProps = {
    autoCorrect: false,
    spellCheck: false,
    autoComplete: 'off' as const,
    importantForAutofill: 'no' as const,
  };

  function setField<K extends keyof RegisterUsuarioPayload>(key: K, value: RegisterUsuarioPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const validation = useMemo(() => {
    const next: Errors = {};
    if (form.nombre.trim().length < 2) next.nombre = 'Nombre mínimo 2 caracteres.';
    if (form.apellido.trim().length < 2) next.apellido = 'Apellido mínimo 2 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Correo inválido.';
    if (form.telefono.trim().length < 8) next.telefono = 'Teléfono inválido.';
    if (form.password.length < 8) next.password = 'Contraseña mínimo 8 caracteres.';
    return next;
  }, [form]);

  async function onSubmit() {
    setServerError('');
    setErrors(validation);
    if (Object.keys(validation).length) return;

    try {
      setSubmitting(true);
      await registerUsuario(form);
      onSuccess();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Error inesperado al registrar.');
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

  const googleBusy = !!google.result;

  return (
    <ScrollView style={styles.card} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registro de usuario</Text>
      <Text style={styles.subtitle}>Crea tu cuenta para agilizar tus próximos envíos.</Text>

      <Pressable style={styles.googleBtn} disabled={googleBusy} onPress={google.prompt}>
        {googleBusy ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.googleBtnText}>Continuar con Google</Text>}
      </Pressable>
      {google.error ? <Text style={styles.error}>{google.error}</Text> : null}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o regístrate con tus datos</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput {...commonInputProps} style={styles.input} placeholder="Nombre" value={form.nombre} onChangeText={(v) => setField('nombre', v)} />
      <InlineError message={errors.nombre} />
      <TextInput {...commonInputProps} style={styles.input} placeholder="Apellido" value={form.apellido} onChangeText={(v) => setField('apellido', v)} />
      <InlineError message={errors.apellido} />
      <TextInput {...commonInputProps} style={styles.input} placeholder="Correo" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => setField('email', v)} />
      <InlineError message={errors.email} />
      <TextInput {...commonInputProps} style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={form.telefono} onChangeText={(v) => setField('telefono', v)} />
      <InlineError message={errors.telefono} />
      <TextInput {...commonInputProps} style={styles.input} placeholder="Contraseña" secureTextEntry value={form.password} onChangeText={(v) => setField('password', v)} />
      <InlineError message={errors.password} />

      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      <Pressable style={[styles.submit, submitting && styles.submitDisabled]} disabled={submitting} onPress={onSubmit}>
        <Text style={styles.submitText}>{submitting ? 'Guardando...' : 'Registrarme'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  content: { padding: 12, gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { color: '#475569', marginBottom: 8 },
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
});