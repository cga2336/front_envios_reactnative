import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Header } from '../components/Header';
import { QuoteCalculator } from '../features/QuoteCalculator';
import { ShipmentForm } from '../features/ShipmentForm';
import { TransportistaLoginForm } from '../features/TransportistaLoginForm';
import { TransportistaRegisterForm } from '../features/TransportistaRegisterForm';
import { TransportistaProfileForm } from '../features/TransportistaProfileForm';
import { UsuarioLoginForm } from '../features/UsuarioLoginForm';
import { UsuarioRegisterForm } from '../features/UsuarioRegisterForm';
import {
  QuoteData,
  Shipment,
  TransportistaProfile,
  TransportistaSession,
  UsuarioSession,
  ViewKey,
} from '../types';
import { loadShipments, saveShipments } from '../utils/shipmentStorage';
import {
  clearTransportistaSession,
  clearUsuarioSession,
  loadTransportistaSession,
  loadUsuarioSession,
  saveTransportistaSession,
  saveUsuarioSession,
} from '../utils/authStorage';

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())} hrs`;
}

export function PortalApp() {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const [view, setView] = useState<ViewKey>('inicio');
  const [transportistaSession, setTransportistaSession] = useState<TransportistaSession | null>(null);
  const [usuarioSession, setUsuarioSession] = useState<UsuarioSession | null>(null);
  const [loginNotice, setLoginNotice] = useState('');
  const [usuarioLoginNotice, setUsuarioLoginNotice] = useState('');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [quoteDraft, setQuoteDraft] = useState<QuoteData | null>(null);
  const [profileNotice, setProfileNotice] = useState('');

  const isTransportista = !!transportistaSession;
  const isUsuario = !!usuarioSession;
  const transportistaProfile: TransportistaProfile | null = transportistaSession?.transportista ?? null;

  useEffect(() => {
    loadTransportistaSession().then((session) => {
      setTransportistaSession(session);
    });
    loadUsuarioSession().then((session) => {
      setUsuarioSession(session);
    });
  }, []);

  useEffect(() => {
    if (view !== 'enviar' && quoteDraft) {
      setQuoteDraft(null);
    }
  }, [view, quoteDraft]);

  useEffect(() => {
    loadShipments().then(setShipments);
  }, []);

  async function handleShipmentCreated(next: Shipment) {
    const updated = [next, ...shipments];
    setShipments(updated);
    await saveShipments(updated);
    setTrackingSearch(next.trackingNumber);
    setView('seguimiento');
  }

  const trackingResult = useMemo(
    () => shipments.find((s) => s.trackingNumber.toLowerCase() === trackingSearch.trim().toLowerCase()),
    [shipments, trackingSearch],
  );

  function handleSendFromQuote(quote: QuoteData) {
    setQuoteDraft(quote);
    setView('enviar');
  }

  async function handleTransportistaPress() {
    if (isTransportista) {
      await clearTransportistaSession();
      setTransportistaSession(null);
      setLoginNotice('');
      setProfileNotice('');
      setView('inicio');
    } else {
      setView('login-transportista');
    }
  }

  function handleTransportistaRegistered(session?: TransportistaSession) {
    if (session) {
      handleTransportistaLogin(session);
      return;
    }
    setLoginNotice('Registro exitoso. Ahora inicia sesión con tu correo y contraseña.');
    setView('login-transportista');
  }

  async function handleVehicleSaved(updated: TransportistaProfile) {
    if (!transportistaSession) return;
    const next = { ...transportistaSession, transportista: updated };
    setTransportistaSession(next);
    await saveTransportistaSession(next);
    setProfileNotice('Perfil actualizado correctamente.');
  }

  async function handleTransportistaLogin(session: TransportistaSession) {
    await saveTransportistaSession(session);
    setTransportistaSession(session);
    setLoginNotice('');
    setProfileNotice('');
    // Regla: tener un vehículo registrado es obligatorio. Sin vehículo se
    // envía al transportista a su perfil para completar RUT, teléfono y camión.
    const tieneVehiculo = !!session.transportista.camion_patente;
    setView(tieneVehiculo ? 'inicio' : 'perfil');
  }

  async function handleUsuarioAuthPress() {
    if (isUsuario) {
      await clearUsuarioSession();
      setUsuarioSession(null);
      setUsuarioLoginNotice('');
      setView('inicio');
    } else {
      setView('login-usuario');
    }
  }

  function handleUsuarioRegistered(session?: UsuarioSession) {
    if (session) {
      handleUsuarioLogin(session);
      return;
    }
    setUsuarioLoginNotice('Registro exitoso. Ahora inicia sesión con tu correo y contraseña.');
    setView('login-usuario');
  }

  async function handleUsuarioLogin(session: UsuarioSession) {
    await saveUsuarioSession(session);
    setUsuarioSession(session);
    setUsuarioLoginNotice('');
    setView('inicio');
  }

  const content = useMemo(() => {
    if (view === 'enviar') {
      return (
        <View style={[styles.sendWrap, isCompact && styles.stackColumn]}>
          <View style={styles.sendImageSlot}>
            <Text style={styles.sendImageTitle}>Espacio para imagen</Text>
            <Text style={styles.sendImageText}>Aquí puedes agregar una imagen o banner promocional del servicio de envíos.</Text>
          </View>
          <View style={styles.sendFormWrap}>
            <ShipmentForm onShipmentCreated={handleShipmentCreated} initialQuote={quoteDraft} />
          </View>
        </View>
      );
    }
    if (view === 'cotizar') return <QuoteCalculator onSendQuote={handleSendFromQuote} />;
    if (view === 'registro-transportista') {
      return <TransportistaRegisterForm onSuccess={handleTransportistaRegistered} />;
    }
    if (view === 'login-transportista') {
      return (
        <TransportistaLoginForm
          onSuccess={handleTransportistaLogin}
          onRegisterPress={() => setView('registro-transportista')}
          notice={loginNotice}
        />
      );
    }
    if (view === 'registro-usuario') {
      return <UsuarioRegisterForm onSuccess={handleUsuarioRegistered} />;
    }
    if (view === 'login-usuario') {
      return (
        <UsuarioLoginForm
          onSuccess={handleUsuarioLogin}
          onRegisterPress={() => setView('registro-usuario')}
          notice={usuarioLoginNotice}
        />
      );
    }
    if (view === 'perfil') {
      if (!transportistaProfile || !transportistaSession) {
        return (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Perfil del transportista</Text>
            <Text style={styles.muted}>Inicia sesión para ver tu perfil.</Text>
          </View>
        );
      }

      const tieneVehiculo = !!transportistaProfile.camion_patente;

      if (!tieneVehiculo) {
        return (
          <TransportistaProfileForm
            transportista={transportistaProfile}
            token={transportistaSession.token}
            onSaved={handleVehicleSaved}
          />
        );
      }

      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Perfil del transportista</Text>
          {profileNotice ? <Text style={styles.success}>{profileNotice}</Text> : null}
          <View style={styles.result}>
            <Text style={styles.resultLine}>
              Nombre: {transportistaProfile.nombre} {transportistaProfile.apellido}
            </Text>
            <Text style={styles.resultLine}>RUT: {transportistaProfile.rut}</Text>
            <Text style={styles.resultLine}>Correo: {transportistaProfile.email}</Text>
            <Text style={styles.resultLine}>Teléfono: {transportistaProfile.telefono}</Text>
            <Text style={styles.resultLine}>Licencia: {transportistaProfile.licencia_conducir || 'No informada'}</Text>
          </View>
          <Text style={styles.sectionTitle2}>Datos del vehículo</Text>
          <View style={styles.result}>
            <Text style={styles.resultLine}>Patente: {transportistaProfile.camion_patente}</Text>
            <Text style={styles.resultLine}>Tipo: {transportistaProfile.camion_tipo}</Text>
            <Text style={styles.resultLine}>
              Capacidad: {Number(transportistaProfile.camion_capacidad_m3 || 0).toFixed(2)} m³
            </Text>
            <Text style={styles.resultLine}>Región base: {transportistaProfile.region_base}</Text>
          </View>
        </View>
      );
    }
    if (view === 'seguimiento') {
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Seguimiento de envíos</Text>
          <TextInput
            placeholder="Ingresa N° de envío"
            value={trackingSearch}
            onChangeText={setTrackingSearch}
            style={styles.input}
          />
          {trackingSearch.trim() ? (
            trackingResult ? (
              <View style={styles.result}>
                <Text style={styles.resultLine}>N° de envío: {trackingResult.trackingNumber}</Text>
                <Text style={styles.resultLine}>Estado: {trackingResult.status}</Text>
                <Text style={styles.resultLine}>Fecha solicitud: {formatDateTime(trackingResult.createdAt)}</Text>
                <Text style={styles.resultLine}>
                  Cliente: {trackingResult.name} {trackingResult.lastName}
                </Text>
                <Text style={styles.resultLine}>Dirección: {trackingResult.shippingAddress}{trackingResult.shippingAddressNumber ? ` ${trackingResult.shippingAddressNumber}` : ''}</Text>
                {trackingResult.paymentType ? (
                  <Text style={styles.resultLine}>
                    Pago: {trackingResult.paymentType.charAt(0).toUpperCase()}
                    {trackingResult.paymentType.slice(1)}
                  </Text>
                ) : null}
                {trackingResult.squareMeters ? (
                  <Text style={styles.resultLine}>Superficie: {trackingResult.squareMeters.toFixed(3)} m²</Text>
                ) : null}
                {trackingResult.total ? (
                  <Text style={styles.resultLine}>Total cotizado: ${trackingResult.total.toLocaleString('es-CL')} CLP</Text>
                ) : null}
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

    return (
      <View style={styles.homeWrap}>
        <View style={styles.heroCard}>
          {!isTransportista ? (
            <>
              <Text style={[styles.heroHeading, isCompact && styles.heroHeadingCompact]}>Cotiza tu envío al instante</Text>
              <Text style={styles.heroSub}>Completa origen, destino y dimensiones para obtener el valor estimado.</Text>
            </>
          ) : (
            <>
              <Text style={[styles.heroHeading, isCompact && styles.heroHeadingCompact]}>Quieres generar ingresos extra?.</Text>
              <Text style={styles.heroSub}>Completa el formulario y date de alta como transportista.</Text>
            </>
          )}

          <View style={[styles.heroContentRow, isCompact && styles.stackColumn]}>
            <View style={styles.heroImageSlot}>
              <Text style={styles.heroImageTitle}>Espacio para imagen</Text>
              <Text style={styles.heroImageText}>Aquí puedes agregar un banner/foto promocional.</Text>
            </View>
            { !isTransportista ?
            <View style={[styles.quoteWrap, isCompact && styles.quoteWrapCompact]}>
              <QuoteCalculator onSendQuote={handleSendFromQuote} />
            </View>:null }
          </View>

          <View style={styles.quickActions}>
           {/*isTransportista  ? <PillButton label="Registro Transportista" onPress={() => setView('registro-transportista')} /> : null*/}
            {isTransportista ? <PillButton label="Mi perfil" onPress={() => setView('perfil')} /> : (
              <>
                <PillButton label="Enviar un paquete" onPress={() => setView('enviar')} />
                <PillButton label="Ver seguimiento" onPress={() => setView('seguimiento')} />
              </>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Llegamos a todos los rincones de Chile</Text>
          <Text style={styles.muted}>Más de 3.000 puntos de envío y retiro de Arica a Puerto Williams.</Text>
          <Image
            source={{ uri: 'https://cdn.blue.cl/cms/2/media/map_Point_9d09e1d639.png' }}
            style={styles.coverImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Más formas de enviar, pagar y recibir tus paquetes</Text>
          <View style={[styles.iconGrid, isCompact && styles.stackColumn]}>
            <IconFeature icon="🖨️" title="Imprime etiqueta" text="En centros de envío habilitados." />
            <IconFeature icon="💳" title="Pago flexible" text="Online, presencial o por pagar." />
            <IconFeature icon="📦" title="Envío y retiro" text="Puntos físicos 24/7." />
            <IconFeature icon="📍" title="Seguimiento" text="Estado del envío en cada etapa." />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Elige la forma de envío que más te acomode</Text>
          <View style={[styles.methodGrid, isCompact && styles.stackColumn]}>
            <MethodCard title="Envía en speed.cl" text="Completa datos, paga, imprime y entrega en un punto." onPress={() => setView('enviar')} />
            <MethodCard title="Plataforma de envíos" text="Para envíos unitarios o múltiples desde una plataforma simple." onPress={() => setView('cotizar')} />
            <MethodCard title="App móvil" text="Gestiona tus envíos desde el celular de forma rápida." onPress={() => setView('enviar')} />
            <MethodCard title="Centro de envíos" text="Gestiona, imprime y entrega directamente en el punto." onPress={() => setView('seguimiento')} />
          </View>
        </View>

        <View style={[styles.lockerBanner, isCompact && styles.stackColumn]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.lockerTitle, isCompact && styles.lockerTitleCompact]}>Necesitas un envio rapido?, Estamos disponibles 24/7!</Text>
            <Text style={styles.lockerText}>Retira y envía cuando quieras, con una experiencia más rápida.</Text>
          </View>
          <Pressable style={[styles.secondaryBtn, isCompact && styles.secondaryBtnCompact]} onPress={() => setView('enviar')}>
            <Text style={styles.secondaryBtnText}>Comenzar envío</Text>
          </Pressable>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Canal de atención oficial</Text>
          <Text style={styles.footerText}>WhatsApp: +56 9 9126235</Text>
          <Text style={styles.footerText}>Centro de ayuda · Encuentra tu punto · Términos y privacidad</Text>
        </View>
      </View>
    );
  }, [
    isCompact,
    isTransportista,
    isUsuario,
    loginNotice,
    profileNotice,
    quoteDraft,
    shipments,
    trackingResult,
    trackingSearch,
    transportistaProfile,
    usuarioLoginNotice,
    view,
  ]);

  return (
    <View style={styles.shell}>
      <View style={[styles.main, isCompact && styles.mainCompact]}>
        <Header
          view={view}
          onChangeView={setView}
          trackingSearch={trackingSearch}
          onTrackingChange={setTrackingSearch}
          onTrackingSubmit={() => setView('seguimiento')}
          isTransportista={isTransportista}
          onToggleTransportista={handleTransportistaPress}
          isUsuario={isUsuario}
          onUsuarioAuthPress={handleUsuarioAuthPress}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      </View>
    </View>
  );
}

function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.pill} onPress={onPress}>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

function IconFeature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={styles.iconCard}>
      <Text style={styles.iconEmoji}>{icon}</Text>
      <Text style={styles.iconTitle}>{title}</Text>
      <Text style={styles.iconText}>{text}</Text>
    </View>
  );
}

function MethodCard({ title, text, onPress }: { title: string; text: string; onPress: () => void }) {
  return (
    <View style={styles.methodCard}>
      <Text style={styles.methodTitle}>{title}</Text>
      <Text style={styles.methodText}>{text}</Text>
      <Pressable style={styles.methodBtn} onPress={onPress}>
        <Text style={styles.methodBtnText}>Ver más</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f5f8ff' },
  main: { flex: 1, width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 12, gap: 12 },
  mainCompact: { paddingHorizontal: 8, paddingVertical: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  homeWrap: { gap: 12 },
  sendWrap: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  stackColumn: { flexDirection: 'column' },
  sendImageSlot: {
    flex: 1,
    minHeight: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe5f5',
    borderStyle: 'dashed',
    backgroundColor: '#f8fbff',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  sendImageTitle: { color: '#1e3a8a', fontWeight: '800' },
  sendImageText: { color: '#64748b', textAlign: 'center' },
  sendFormWrap: { flex: 1 },
  heroCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe5f5',
    padding: 16,
    gap: 10,
  },
  heroHeading: { color: '#0f172a', fontSize: 28, fontWeight: '800' },
  heroHeadingCompact: { fontSize: 23 },
  heroSub: { color: '#475569' },
  heroContentRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  heroImageSlot: {
    flex: 1,
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe5f5',
    borderStyle: 'dashed',
    backgroundColor: '#f8fbff',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  heroImageTitle: { color: '#1e3a8a', fontWeight: '800' },
  heroImageText: { color: '#64748b', textAlign: 'center' },
  quoteWrap: {
    width: 420,
    alignSelf: 'flex-end',
  },
  quoteWrapCompact: { width: '100%', alignSelf: 'stretch' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, backgroundColor: 'white' },
  quickActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { backgroundColor: '#e0ecff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { color: '#1e3a8a', fontWeight: '700' },
  sectionCard: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#dbe5f5', padding: 14, gap: 10 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#0f172a' },
  sectionTitleCompact: { fontSize: 19 },
  sectionTitle2: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 10 },
  success: { color: '#166534', backgroundColor: '#dcfce7', borderRadius: 8, padding: 8, marginVertical: 6 },
  muted: { color: '#475569' },
  coverImage: { width: '100%', height: 220, borderRadius: 8, backgroundColor: '#f8fafc' },
  iconGrid: { flexDirection: 'row', gap: 8 },
  iconCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fbff', padding: 10, gap: 4 },
  iconEmoji: { fontSize: 22 },
  iconTitle: { fontWeight: '700', color: '#0f172a' },
  iconText: { color: '#475569' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodCard: { flex: 1, minWidth: 230, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, gap: 6 },
  methodTitle: { fontWeight: '800', color: '#0f172a' },
  methodText: { color: '#475569' },
  methodBtn: { alignSelf: 'flex-start', backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 },
  methodBtnText: { color: '#1e3a8a', fontWeight: '700' },
  lockerBanner: {
    borderRadius: 14,
    backgroundColor: '#07215f',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  lockerTitle: { color: 'white', fontSize: 24, fontWeight: '800' },
  lockerTitleCompact: { fontSize: 20 },
  lockerText: { color: '#bfdbfe' },
  secondaryBtn: { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'center' },
  secondaryBtnCompact: { alignSelf: 'flex-start' },
  secondaryBtnText: { color: '#052e16', fontWeight: '800' },
  footerCard: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, gap: 4 },
  footerTitle: { color: 'white', fontWeight: '800' },
  footerText: { color: '#cbd5e1' },
  result: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, gap: 4 },
  resultLine: { color: '#0f172a' },
  error: { color: '#b91c1c' },
});
