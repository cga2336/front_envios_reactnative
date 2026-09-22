import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AddressResult, QuoteData, Shipment } from '../types';
import { createTrackingNumber } from '../utils/shipmentStorage';
import { CLP_PER_SQUARE_METER, TransportUnit, computeTransportQuote } from '../utils/quote';

type ShipmentFormProps = {
  onShipmentCreated: (shipment: Shipment) => void;
  initialQuote?: QuoteData | null;
};

function formatShortResult(item: AddressResult): string {
  const addr = item.address ?? {};
  const street = addr.road || addr.pedestrian || addr.footway || addr.path || addr.service_road;
  const comuna = addr.suburb || addr.city || addr.town || addr.village || addr.municipality || addr.city_district;
  const region = addr.state || addr.region;

  const parts: string[] = [];
  if (street) parts.push(street);
  if (comuna && comuna !== street && comuna !== region) parts.push(comuna);
  if (region && region !== street && region !== comuna) parts.push(region);
  return parts.join(', ');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const PAYMENT_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'por pagar', label: 'Por pagar' },
];

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^[2-9]\d{7,8}$/.test(digits);
}

function isValidRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  if (!/^\d{1,8}$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);
  return expected === dv;
}

export function ShipmentForm({ onShipmentCreated, initialQuote }: ShipmentFormProps) {
  const commonTextInputProps = {
    autoCorrect: false,
    spellCheck: false,
    autoComplete: 'off' as const,
    importantForAutofill: 'no' as const,
  };

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rut, setRut] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingAddressNumber, setShippingAddressNumber] = useState('');
  const [pickupPoint, setPickupPoint] = useState('Sucursal Centro');
  const [lastTrackingCreated, setLastTrackingCreated] = useState('');

  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const suppressAddressSearchRef = useRef(false);

  const [step, setStep] = useState<'cliente' | 'transporte'>('cliente');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [lengthUnit, setLengthUnit] = useState<TransportUnit>('m');
  const [widthUnit, setWidthUnit] = useState<TransportUnit>('m');
  const [paymentType, setPaymentType] = useState('');

  const transportQuote = useMemo(
    () => computeTransportQuote(length, width, lengthUnit, widthUnit),
    [length, width, lengthUnit, widthUnit],
  );

  const formValid = useMemo(
    () =>
      name.trim().length > 0 &&
      lastName.trim().length > 0 &&
      isValidEmail(email) &&
      isValidPhone(phone) &&
      isValidRut(rut) &&
      shippingAddress.trim().length >= 5 &&
      shippingAddressNumber.trim().length > 0 &&
      paymentType.trim().length > 0,
    [name, lastName, email, phone, rut, shippingAddress, shippingAddressNumber, paymentType],
  );

  useEffect(() => {
    if (!initialQuote) return;
    setPickupPoint(initialQuote.origin);
    setShippingAddress(initialQuote.destination);
  }, [initialQuote]);

  useEffect(() => {
    if (suppressAddressSearchRef.current) {
      suppressAddressSearchRef.current = false;
      setAddressLoading(false);
      return;
    }

    const query = shippingAddress.trim();
    if (query.length < 3) {
      setAddressOptions([]);
      setAddressError('');
      setAddressLoading(false);
      return;
    }

    let stale = false;
    setAddressLoading(true);

    const handle = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&accept-language=es&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`,
        );
        if (!response.ok) throw new Error('No se pudo buscar la dirección.');
        const data = (await response.json()) as AddressResult[];
        if (stale) return;
        const labels = Array.from(new Set(data.map(formatShortResult).filter(Boolean)));
        setAddressOptions(labels);
        setAddressError(labels.length ? '' : 'No se encontraron resultados para ese criterio.');
      } catch {
        if (stale) return;
        setAddressError('Error al consultar el servicio de direcciones. Intenta nuevamente.');
      } finally {
        if (!stale) setAddressLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(handle);
      stale = true;
    };
  }, [shippingAddress]);

  function updateNumberField(field: 'length' | 'width', value: string) {
    const numericRegex = /^\d{0,6}([.,]\d{0,2})?$/;
    if (!numericRegex.test(value)) return;
    if (field === 'length') setLength(value);
    else setWidth(value);
  }

  function handleSubmitShipment() {
    if (!formValid || !transportQuote) return;

    const trackingNumber = createTrackingNumber();

    const next: Shipment = {
      trackingNumber,
      name,
      lastName,
      email,
      phone,
      rut,
      shippingAddress,
      shippingAddressNumber: shippingAddressNumber,
      pickupPoint,
      paymentType,
      length,
      width,
      lengthUnit,
      widthUnit,
      squareMeters: transportQuote.squareMeters,
      total: transportQuote.total,
      status: 'Creado',
      createdAt: new Date().toISOString(),
    };

    onShipmentCreated(next);
    setLastTrackingCreated(trackingNumber);

    setName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRut('');
    setShippingAddress('');
    setShippingAddressNumber('');
    setPaymentType('');
    setAddressOptions([]);
    setAddressError('');
    setAddressLoading(false);
  }

  return (
    <ScrollView style={styles.card} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Generar envío</Text>

      {step === 'cliente' ? (
        <>
          <TextInput {...commonTextInputProps} style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
          <TextInput {...commonTextInputProps} style={styles.input} placeholder="Apellido" value={lastName} onChangeText={setLastName} />
          <TextInput {...commonTextInputProps} style={styles.input} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <TextInput {...commonTextInputProps} style={styles.input} placeholder="Celular" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput {...commonTextInputProps} style={styles.input} placeholder="RUT" value={rut} onChangeText={setRut} />
          <TextInput
            {...commonTextInputProps}
            style={styles.input}
            placeholder="Dirección de envío"
            value={shippingAddress}
            onChangeText={(text) => {
              suppressAddressSearchRef.current = false;
              setShippingAddress(text);
            }}
          />

          {addressLoading ? <Text style={styles.hint}>Buscando direcciones...</Text> : null}
          {addressError ? <Text style={styles.error}>{addressError}</Text> : null}

          {addressOptions.map((option) => (
            <Pressable
              key={option}
              style={styles.option}
              onPress={() => {
                suppressAddressSearchRef.current = true;
                setShippingAddress(option);
                setAddressOptions([]);
                setAddressError('');
                setAddressLoading(false);
              }}
            >
              <Text>{option}</Text>
            </Pressable>
          ))}

          <TextInput
            {...commonTextInputProps}
            style={styles.input}
            placeholder="N° de dirección (ej: 1234)"
            value={shippingAddressNumber}
            onChangeText={setShippingAddressNumber}
            keyboardType="number-pad"
          />

          <PaymentSelect value={paymentType} onChange={setPaymentType} />

          <TextInput {...commonTextInputProps} style={styles.input} placeholder="Punto de retiro" value={pickupPoint} onChangeText={setPickupPoint} />

          <Pressable
            style={[styles.submit, !formValid && styles.submitDisabled]}
            disabled={!formValid}
            onPress={() => setStep('transporte')}
          >
            <Text style={styles.submitText}>Crear envío</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLine}>Cliente: {name} {lastName}</Text>
            <Text style={styles.summaryLine}>Rut: {rut}</Text>
            <Text style={styles.summaryLine}>Correo: {email}</Text>
            <Text style={styles.summaryLine}>Telefono: {phone}</Text>
            <Text style={styles.summaryLine}>Dirección: {shippingAddress}{shippingAddressNumber ? ` ${shippingAddressNumber}` : ''}</Text>
            <Text style={styles.summaryLine}>Numeración: # {shippingAddressNumber}</Text>
            <Text style={styles.summaryLine}>Forma de pago: {paymentType}</Text>
            <Text style={styles.summaryLine}>Punto de retiro: {pickupPoint}</Text>
          </View>
          <Pressable style={styles.backBtn} onPress={() => setStep('cliente')}>
            <Text style={styles.backBtnText}>← Editar datos de envio</Text>
          </Pressable>
          <br></br>
           <br></br>
          <Text style={styles.stepTitle}>Datos del transporte</Text>

          <View style={styles.dimensionRow}>
            <TextInput
              {...commonTextInputProps}
              style={styles.inputInline}
              placeholder={`Largo (${lengthUnit})`}
              keyboardType="decimal-pad"
              value={length}
              onChangeText={(value) => updateNumberField('length', value)}
            />
            <UnitToggle unit={lengthUnit} onChange={setLengthUnit} />
          </View>

          <View style={styles.dimensionRow}>
            <TextInput
              {...commonTextInputProps}
              style={styles.inputInline}
              placeholder={`Ancho (${widthUnit})`}
              keyboardType="decimal-pad"
              value={width}
              onChangeText={(value) => updateNumberField('width', value)}
            />
            <UnitToggle unit={widthUnit} onChange={setWidthUnit} />
          </View>

          {transportQuote ? (
            <View style={styles.result}>
              <Text>Superficie: {transportQuote.squareMeters.toFixed(3)} m²</Text>
              <Text>Tarifa: ${CLP_PER_SQUARE_METER.toLocaleString('es-CL')} CLP por m²</Text>
              <Text style={styles.total}>Total estimado: ${transportQuote.total.toLocaleString('es-CL')} CLP</Text>
              <Pressable style={styles.submit} onPress={handleSubmitShipment}>
                <Text style={styles.submitText}>Enviar</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.muted}>Ingresa el largo y ancho para calcular la cotización.</Text>
          )}

        </>
      )}

      {lastTrackingCreated ? (
        <Text style={styles.success}>Envío creado correctamente. N° de seguimiento: {lastTrackingCreated}</Text>
      ) : null}
    </ScrollView>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: TransportUnit;
  onChange: (next: TransportUnit) => void;
}) {
  return (
    <View style={styles.unitToggle}>
      {(['m', 'cm'] as TransportUnit[]).map((u) => (
        <Pressable
          key={u}
          style={[styles.unitOption, unit === u && styles.unitOptionActive]}
          onPress={() => onChange(u)}
        >
          <Text style={[styles.unitOptionText, unit === u && styles.unitOptionTextActive]}>{u}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PaymentSelect({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = PAYMENT_OPTIONS.find((o) => o.value === value);

  return (
    <View style={styles.payWrap}>
      <Pressable style={styles.payTrigger} onPress={() => setOpen((prev) => !prev)}>
        <Text style={[styles.payTriggerText, !selected && styles.payPlaceholder]}>
          {selected ? selected.label : 'Tipo de pago'}
        </Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.payMenu}>
          {PAYMENT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.payOption, value === option.value && styles.payOptionActive]}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.payOptionText, value === option.value && styles.payOptionTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  content: { padding: 12, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  input: {
    width: '80%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    fontSize: 13,
  },
  hint: { color: '#64748b', alignSelf: 'center' },
  option: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 8 },
  summaryBox: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, gap: 2 },
  summaryLine: { color: '#0f172a' },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  dimensionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  inputInline: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    fontSize: 13,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  unitOption: { paddingHorizontal: 12, paddingVertical: 7, justifyContent: 'center' },
  unitOptionActive: { backgroundColor: '#2563eb' },
  unitOptionText: { color: '#1e3a8a', fontWeight: '700', fontSize: 13 },
  unitOptionTextActive: { color: 'white' },
  result: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, gap: 4 },
  total: { fontWeight: '700' },
  muted: { color: '#475569', alignSelf: 'center' },
  payWrap: { width: '80%', alignSelf: 'center', gap: 4 },
  payTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: 'white',
  },
  payTriggerText: { color: '#0f172a', fontSize: 13 },
  payPlaceholder: { color: '#94a3b8' },
  chevron: { color: '#475569', fontSize: 10 },
  payMenu: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  payOption: { paddingHorizontal: 9, paddingVertical: 8 },
  payOptionActive: { backgroundColor: '#2563eb' },
  payOptionText: { color: '#0f172a', fontSize: 13 },
  payOptionTextActive: { color: 'white' },
  backBtn: { marginTop: 4 },
  backBtnText: { color: '#2563eb', fontWeight: '600' },
  submit: { marginTop: 4, backgroundColor: '#1d4ed8', padding: 12, borderRadius: 10, alignItems: 'center' },
  submitDisabled: { backgroundColor: '#94a3b8' },
  submitText: { color: 'white', fontWeight: '700' },
  success: { color: '#166534' },
  error: { color: '#b91c1c' },
});
