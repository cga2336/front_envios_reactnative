import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { QuoteData } from '../types';
import { CLP_PER_SQUARE_METER } from '../utils/quote';

type Unit = 'm' | 'cm';

type FieldErrors = {
  origin?: string;
  destination?: string;
  length?: string;
  width?: string;
};

type FieldTouched = {
  origin: boolean;
  destination: boolean;
  length: boolean;
  width: boolean;
};

type CityOption = {
  label: string;
  full: string;
  value: string;
};

type NominatimResult = {
  display_name: string;
  address?: {
    city?: string;
    county?: string;
    suburb?: string;
    city_district?: string;
    state_district?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
  };
};

type QuoteCalculatorProps = {
  onSendQuote?: (quote: QuoteData) => void;
};

export function QuoteCalculator({ onSendQuote }: QuoteCalculatorProps) {
  const commonTextInputProps = {
    autoCorrect: false,
    spellCheck: false,
    autoComplete: 'off' as const,
    importantForAutofill: 'no' as const,
  };

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [lengthUnit, setLengthUnit] = useState<Unit>('m');
  const [widthUnit, setWidthUnit] = useState<Unit>('m');
  const [openSelect, setOpenSelect] = useState<null | 'length' | 'width'>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<FieldTouched>({ origin: false, destination: false, length: false, width: false });
  const [originOptions, setOriginOptions] = useState<CityOption[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<CityOption[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<null | 'origin' | 'destination'>(null);
  const [skipNextOriginSearch, setSkipNextOriginSearch] = useState(false);
  const [skipNextDestinationSearch, setSkipNextDestinationSearch] = useState(false);

  function markTouched(field: keyof FieldTouched) {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }

  function updateTextField(field: 'origin' | 'destination', value: string) {
    const textRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,'\-]*$/;
    if (!textRegex.test(value)) {
      setErrors((prev) => ({ ...prev, [field]: 'Solo se permiten letras, números y signos básicos (, . - \' )' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === 'origin') setOrigin(value);
    else setDestination(value);
  }

  async function searchCities(query: string, field: 'origin' | 'destination') {
    if (query.trim().length < 2) {
      if (field === 'origin') setOriginOptions([]);
      else setDestinationOptions([]);
      return;
    }

    if (field === 'origin') setOriginLoading(true);
    else setDestinationLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=cl&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) throw new Error('Error al buscar ciudades');
      const data = (await response.json()) as NominatimResult[];

      const next = data
        .map((item) => {
          const cityOrTown =
            item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.municipality ||
            item.address?.state_district;

          const comuna =
            item.address?.suburb ||
            item.address?.city_district ||
            item.address?.municipality ||
            item.address?.state_district ||
            item.address?.county;

          const region = item.address?.state;

          if (!cityOrTown && !comuna) return null;

          const parts: string[] = [];
          [cityOrTown, comuna, region].forEach((part) => {
            if (!part) return;
            const exists = parts.some((p) => p.toLowerCase() === part.toLowerCase());
            if (!exists) parts.push(part);
          });

          const formatted = parts.join(', ');

          return {
            label: cityOrTown || comuna || 'Ubicación',
            full: item.display_name,
            value: formatted,
          };
        })
        .filter((item): item is CityOption => item !== null)
        .filter((item, index, arr) => arr.findIndex((x) => x.value.toLowerCase() === item.value.toLowerCase()) === index)
        .slice(0, 5);

      if (field === 'origin') setOriginOptions(next);
      else setDestinationOptions(next);
    } catch {
      if (field === 'origin') setOriginOptions([]);
      else setDestinationOptions([]);
    } finally {
      if (field === 'origin') setOriginLoading(false);
      else setDestinationLoading(false);
    }
  }

  function updateNumberField(field: 'length' | 'width', value: string) {
    const numericRegex = /^\d{0,6}([.,]\d{0,2})?$/;
    if (!numericRegex.test(value)) {
      setErrors((prev) => ({ ...prev, [field]: 'Debe ser numérico positivo (hasta 2 decimales).' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === 'length') setLength(value);
    else setWidth(value);
  }

  const quote = useMemo(() => {
    const l = Number(length.replace(',', '.'));
    const w = Number(width.replace(',', '.'));
    if (!l || !w || l <= 0 || w <= 0) return null;

    const lengthInMeters = lengthUnit === 'cm' ? l / 100 : l;
    const widthInMeters = widthUnit === 'cm' ? w / 100 : w;
    const squareMeters = lengthInMeters * widthInMeters;
    const total = squareMeters * CLP_PER_SQUARE_METER;
    return { squareMeters, total };
  }, [length, width, lengthUnit, widthUnit]);

  const issues = useMemo(() => {
    const next: string[] = [];
    if (!origin.trim()) next.push('Debes ingresar el origen.');
    if (!destination.trim()) next.push('Debes ingresar el destino.');
    if (!length.trim()) next.push(`Debes ingresar el largo en ${lengthUnit}.`);
    if (!width.trim()) next.push(`Debes ingresar el ancho en ${widthUnit}.`);
    if (errors.origin) next.push(`Origen: ${errors.origin}`);
    if (errors.destination) next.push(`Destino: ${errors.destination}`);
    if (errors.length) next.push(`Largo: ${errors.length}`);
    if (errors.width) next.push(`Ancho: ${errors.width}`);
    return next;
  }, [destination, errors.destination, errors.length, errors.origin, errors.width, length, lengthUnit, origin, width, widthUnit]);

  useEffect(() => {
    if (focusedField !== 'origin') return;
    if (skipNextOriginSearch) {
      setSkipNextOriginSearch(false);
      return;
    }
    const timeout = setTimeout(() => {
      searchCities(origin, 'origin');
    }, 350);
    return () => clearTimeout(timeout);
  }, [origin, focusedField, skipNextOriginSearch]);

  useEffect(() => {
    if (focusedField !== 'destination') return;
    if (skipNextDestinationSearch) {
      setSkipNextDestinationSearch(false);
      return;
    }
    const timeout = setTimeout(() => {
      searchCities(destination, 'destination');
    }, 350);
    return () => clearTimeout(timeout);
  }, [destination, focusedField, skipNextDestinationSearch]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Cotizar transporte</Text>
      <View style={styles.autoWrap}>
        <TextInput
          {...commonTextInputProps}
          style={styles.input}
          placeholder="Origen (ciudad, comuna o pueblo de Chile)"
        value={origin}
        onChangeText={(value) => {
          markTouched('origin');
          updateTextField('origin', value);
        }}
        onFocus={() => setFocusedField('origin')}
        onBlur={() => {
          markTouched('origin');
          setTimeout(() => {
            setFocusedField((prev) => (prev === 'origin' ? null : prev));
            setOriginOptions([]);
          }, 120);
        }}
      />
      {!!originLoading && <Text style={styles.helper}>Buscando ciudades...</Text>}
        {focusedField === 'origin' && originOptions.length > 0 ? (
          <View style={styles.optionsBox}>
            {originOptions.map((option) => (
              <Pressable
                key={`origin-${option.full}`}
                style={styles.optionItem}
                onPress={() => {
                  setSkipNextOriginSearch(true);
                  setOrigin(option.value);
                  setOriginOptions([]);
                  setFocusedField(null);
                }}
              >
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionSubtitle}>{option.full}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.autoWrap}>
        <TextInput
          {...commonTextInputProps}
          style={styles.input}
          placeholder="Destino (ciudad, comuna o pueblo de Chile)"
        value={destination}
        onChangeText={(value) => {
          markTouched('destination');
          updateTextField('destination', value);
        }}
        onFocus={() => setFocusedField('destination')}
        onBlur={() => {
          markTouched('destination');
          setTimeout(() => {
            setFocusedField((prev) => (prev === 'destination' ? null : prev));
            setDestinationOptions([]);
          }, 120);
        }}
      />
      {!!destinationLoading && <Text style={styles.helper}>Buscando ciudades...</Text>}
        {focusedField === 'destination' && destinationOptions.length > 0 ? (
          <View style={styles.optionsBox}>
            {destinationOptions.map((option) => (
              <Pressable
                key={`destination-${option.full}`}
                style={styles.optionItem}
                onPress={() => {
                  setSkipNextDestinationSearch(true);
                  setDestination(option.value);
                  setDestinationOptions([]);
                  setFocusedField(null);
                }}
              >
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionSubtitle}>{option.full}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={[styles.dimensionRow, openSelect === 'length' && styles.dimensionRowOnTop]}>
        <View style={styles.inputWithSelectWrap}>
          <TextInput
            {...commonTextInputProps}
            style={styles.inputInline}
            placeholder={`Largo (${lengthUnit})`}
            keyboardType="decimal-pad"
            value={length}
            onChangeText={(value) => {
              markTouched('length');
              updateNumberField('length', value);
            }}
            onBlur={() => markTouched('length')}
          />
          <UnitSelect
            unit={lengthUnit}
            open={openSelect === 'length'}
            onToggle={() => setOpenSelect((prev) => (prev === 'length' ? null : 'length'))}
            onSelect={(next) => {
              setLengthUnit(next);
              setOpenSelect(null);
            }}
          />
        </View>
      </View>

      <View style={[styles.dimensionRow, openSelect === 'width' && styles.dimensionRowOnTop]}>
        <View style={styles.inputWithSelectWrap}>
          <TextInput
            {...commonTextInputProps}
            style={styles.inputInline}
            placeholder={`Ancho (${widthUnit})`}
            keyboardType="decimal-pad"
            value={width}
            onChangeText={(value) => {
              markTouched('width');
              updateNumberField('width', value);
            }}
            onBlur={() => markTouched('width')}
          />
          <UnitSelect
            unit={widthUnit}
            open={openSelect === 'width'}
            onToggle={() => setOpenSelect((prev) => (prev === 'width' ? null : 'width'))}
            onSelect={(next) => {
              setWidthUnit(next);
              setOpenSelect(null);
            }}
          />
        </View>
      </View>

      {!Object.values(touched).every(Boolean) ? (
        <Text style={styles.muted}>Completa e interactúa con todos los campos para validar la cotización.</Text>
      ) : !issues.length && quote ? (
        <View style={styles.result}>
          <Text>Superficie: {quote.squareMeters.toFixed(3)} m²</Text>
          <Text>Tarifa: ${CLP_PER_SQUARE_METER.toLocaleString('es-CL')} CLP por m²</Text>
          <Text style={styles.total}>Total estimado: ${quote.total.toLocaleString('es-CL')} CLP</Text>
          <Pressable
            style={styles.sendBtn}
            onPress={() =>
              onSendQuote?.({
                origin: origin.trim(),
                destination: destination.trim(),
                length,
                width,
                lengthUnit,
                widthUnit,
                squareMeters: quote.squareMeters,
                total: quote.total,
              })
            }
          >
            <Text style={styles.sendBtnText}>Enviar paquete</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>No se puede calcular todavía:</Text>
          {issues.length ? issues.map((issue) => <Text key={issue} style={styles.errorItem}>• {issue}</Text>) : <Text style={styles.muted}>Completa los campos para cotizar.</Text>}
        </View>
      )}
    </View>
  );
}

function UnitSelect({
  unit,
  open,
  onToggle,
  onSelect,
}: {
  unit: Unit;
  open: boolean;
  onToggle: () => void;
  onSelect: (next: Unit) => void;
}) {
  return (
    <View style={styles.selectWrap}>
      <Pressable style={styles.selectTrigger} onPress={onToggle}>
        <Text style={styles.selectTriggerText}>{unit}</Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.selectMenu}>
          <Pressable style={[styles.selectOption, unit === 'm' && styles.selectOptionActive]} onPress={() => onSelect('m')}>
            <Text style={[styles.selectOptionText, unit === 'm' && styles.selectOptionTextActive]}>m</Text>
          </Pressable>
          <Pressable style={[styles.selectOption, unit === 'cm' && styles.selectOptionActive]} onPress={() => onSelect('cm')}>
            <Text style={[styles.selectOptionText, unit === 'cm' && styles.selectOptionTextActive]}>cm</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 8, overflow: 'visible' },
  title: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  autoWrap: { zIndex: 50 },
  helper: { color: '#64748b', fontSize: 12, marginTop: 4 },
  optionsBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  optionItem: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  optionTitle: { color: '#0f172a', fontWeight: '700' },
  optionSubtitle: { color: '#64748b', fontSize: 12 },
  dimensionRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch', zIndex: 1 },
  dimensionRowOnTop: { zIndex: 30 },
  inputWithSelectWrap: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 20,
    overflow: 'visible',
  },
  inputInline: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  selectWrap: {
    width: 76,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    position: 'relative',
    zIndex: 40,
  },
  selectTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
  },
  selectTriggerText: { color: '#0f172a', fontWeight: '700' },
  chevron: { color: '#475569', fontSize: 10 },
  selectMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    backgroundColor: 'white',
    marginTop: 4,
    minWidth: 76,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  selectOption: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 8,
  },
  selectOptionActive: { backgroundColor: '#2563eb' },
  selectOptionText: { color: '#1e3a8a', fontWeight: '700' },
  selectOptionTextActive: { color: 'white' },
  result: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, gap: 4 },
  total: { fontWeight: '700' },
  sendBtn: {
    marginTop: 8,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sendBtnText: { color: 'white', fontWeight: '700' },
  muted: { color: '#475569' },
  errorBox: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', borderRadius: 8, padding: 10, gap: 4 },
  errorTitle: { color: '#9f1239', fontWeight: '700' },
  errorItem: { color: '#9f1239' },
});
