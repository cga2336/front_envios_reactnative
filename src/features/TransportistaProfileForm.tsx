import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CompleteProfilePayload, TransportistaProfile } from '../types';
import { updateTransportistaPerfil } from '../services/transportistaApi';

type Props = {
  transportista: TransportistaProfile;
  token: string;
  onSaved: (updated: TransportistaProfile) => void;
};

type Errors = Partial<Record<keyof CompleteProfilePayload, string>>;

export function TransportistaProfileForm({ transportista, token, onSaved }: Props) {
  const [form, setForm] = useState<CompleteProfilePayload>({
    telefono: transportista.telefono ?? '',
    rut: transportista.rut ?? '',
    licenciaConducir: transportista.licencia_conducir ?? '',
    camionPatente: transportista.camion_patente ?? '',
    camionTipo: transportista.camion_tipo ?? '',
    camionCapacidadM3: Number(transportista.camion_capacidad_m3) || 0,
    regionBase: transportista.region_base ?? '',
  });
  const [capacidadInput, setCapacidadInput] = useState(
    transportista.camion_capacidad_m3 ? String(Number(transportista.camion_capacidad_m3)) : '',
  );
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const commonInputProps = {
    autoCorrect: false,
    spellCheck: false,
    autoComplete: 'off' as const,
    importantForAutofill: 'no' as const,
  };

  function setField<K extends keyof CompleteProfilePayload>(key: K, value: CompleteProfilePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const validation = useMemo(() => {
    const next: Errors = {};
    if (form.telefono.trim().length < 8) next.telefono = 'Teléfono inválido (mínimo 8 caracteres).';
    if (form.rut.trim().length < 7) next.rut = 'RUT inválido.';
    if (form.camionPatente.trim().length < 5) next.camionPatente = 'Patente inválida.';
    if (form.camionTipo.trim().length < 2) next.camionTipo = 'Tipo de camión requerido.';
    if (!form.camionCapacidadM3 || form.camionCapacidadM3 <= 0) next.camionCapacidadM3 = 'Capacidad debe ser mayor a 0.';
    if (form.regionBase.trim().length < 2) next.regionBase = 'Región base requerida.';
    return next;
  }, [form]);

  async function onSubmit() {
    setServerError('');
    setErrors(validation);
    if (Object.keys(validation).length) return;

    try {
      setSubmitting(true);
      const updated = await updateTransportistaPerfil(transportista.id, form, token);
      onSaved(updated);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Error inesperado al guardar tu perfil.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.card} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Completa tu perfil como transportista</Text>
      <Text style={styles.subtitle}>
        Tu cuenta se creó con Google. Agrega tu teléfono, RUT y los datos de tu vehículo para comenzar.
      </Text>

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Teléfono"
        keyboardType="phone-pad"
        value={form.telefono}
        onChangeText={(v) => setField('telefono', v)}
      />
      <InlineError message={errors.telefono} />

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="RUT"
        value={form.rut}
        onChangeText={(v) => setField('rut', v)}
      />
      <InlineError message={errors.rut} />

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Licencia de conducir (opcional)"
        value={form.licenciaConducir ?? ''}
        onChangeText={(v) => setField('licenciaConducir', v)}
      />

      <Text style={styles.sectionLabel}>Datos del vehículo</Text>

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Patente del camión"
        value={form.camionPatente}
        onChangeText={(v) => setField('camionPatente', v)}
      />
      <InlineError message={errors.camionPatente} />

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Tipo de camión"
        value={form.camionTipo}
        onChangeText={(v) => setField('camionTipo', v)}
      />
      <InlineError message={errors.camionTipo} />

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Capacidad m³"
        keyboardType="decimal-pad"
        value={capacidadInput}
        onChangeText={(v) => {
          const cleaned = v.replace(',', '.');
          if (!/^\d{0,6}(\.\d{0,2})?$/.test(cleaned)) return;
          setCapacidadInput(v);
          setField('camionCapacidadM3', Number(cleaned) || 0);
        }}
      />
      <InlineError message={errors.camionCapacidadM3} />

      <TextInput
        {...commonInputProps}
        style={styles.input}
        placeholder="Región base"
        value={form.regionBase}
        onChangeText={(v) => setField('regionBase', v)}
      />
      <InlineError message={errors.regionBase} />

      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      <Pressable style={[styles.submit, submitting && styles.submitDisabled]} disabled={submitting} onPress={onSubmit}>
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitText}>Guardar datos</Text>
        )}
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
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  subtitle: { color: '#475569', marginBottom: 6 },
  sectionLabel: { color: '#0f172a', fontWeight: '800', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  error: { color: '#b91c1c', marginBottom: 2 },
  serverError: { color: '#9f1239', backgroundColor: '#fff1f2', borderRadius: 8, padding: 8 },
  submit: { marginTop: 8, backgroundColor: '#1d4ed8', borderRadius: 10, padding: 12, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: 'white', fontWeight: '700' },
});