import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Shipment } from '../types';

type TrackingPanelProps = {
  shipments: Shipment[];
};

export function TrackingPanel({ shipments }: TrackingPanelProps) {
  const [trackingSearch, setTrackingSearch] = useState('');

  const trackingResult = useMemo(
    () => shipments.find((s) => s.trackingNumber.toLowerCase() === trackingSearch.trim().toLowerCase()),
    [shipments, trackingSearch],
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Seguimiento de envíos</Text>
      <TextInput placeholder="Ingresa N° de envío" value={trackingSearch} onChangeText={setTrackingSearch} style={styles.input} />

      {trackingSearch.trim() ? (
        trackingResult ? (
          <View style={styles.result}>
            <Text>N° de envío: {trackingResult.trackingNumber}</Text>
            <Text>
              Cliente: {trackingResult.name} {trackingResult.lastName}
            </Text>
            <Text>Numero telefonico: {trackingResult.phone}</Text>
            <Text>Correo electronico: {trackingResult.email}</Text>
            <Text>Dirección: {trackingResult.shippingAddress}</Text>
            <Text>Forma de pago: {trackingResult.paymentType}</Text>
             <Text>Estado: {trackingResult.status}</Text>
          </View>
        ) : (
          <Text style={styles.error}>No existe un envío con ese número.</Text>
        )
      ) : (
        <Text style={styles.muted}>Escribe el número de envío para consultar su estado.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  result: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, gap: 4 },
  muted: { color: '#475569' },
  error: { color: '#b91c1c' },
});
