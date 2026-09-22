import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Pressable } from 'react-native';

type ViewKey =
  | 'inicio'
  | 'enviar'
  | 'cotizar'
  | 'seguimiento'
  | 'perfil'
  | 'registro-transportista'
  | 'login-transportista'
  | 'registro-usuario'
  | 'login-usuario';

type HeaderProps = {
  view: ViewKey;
  onChangeView: (view: ViewKey) => void;
  trackingSearch: string;
  onTrackingChange: (value: string) => void;
  onTrackingSubmit: () => void;
  isTransportista: boolean;
  onToggleTransportista: () => void;
  isUsuario: boolean;
  onUsuarioAuthPress: () => void;
};

export function Header({
  view,
  onChangeView,
  trackingSearch,
  onTrackingChange,
  onTrackingSubmit,
  isTransportista,
  onToggleTransportista,
  isUsuario,
  onUsuarioAuthPress,
}: HeaderProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const isTransportistaArea = isTransportista || view === 'login-transportista';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isCompact) setMenuOpen(false);
  }, [isCompact]);

  return (
    <View style={styles.wrap}>
      {!isCompact ? (
        <View style={styles.topLine}>
          {!isTransportistaArea ? <Text style={styles.topLink}>Enviar</Text> : null}

          {!isUsuario ?
            <Pressable style={styles.transportistaLink} onPress={onToggleTransportista}>
            <Text style={[styles.topLink, styles.transportistaText]}>{isTransportistaArea  ? '' : 'Transportista' }</Text>
          </Pressable>: null }

        

          <Text style={styles.topLink}>Empresas</Text>
          <Text style={styles.topLink}>Nosotros</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MOON</Text>
          <Text style={styles.subtitle}>
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!isCompact ? (

            isUsuario || isTransportista ? (
              <Pressable style={styles.transportistaLink} onPress={ isUsuario ? onUsuarioAuthPress:onToggleTransportista}>
                <Text style={[styles.topLink, styles.transportistaText]}>Cerrar sesión</Text>
              </Pressable>
            ) 
            : 
            (
              <>
              <Pressable onPress={onUsuarioAuthPress}>
                <Text style={styles.login}>Regístrate / Hola sesión</Text>
              </Pressable>
              </>
             
            )
          ) : null}
          {isCompact ? (
            <Pressable style={styles.burgerBtn} onPress={() => setMenuOpen((prev) => !prev)}>
              <Text style={styles.burgerIcon}>{menuOpen ? '✕' : '☰'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {!isCompact ? (
        <View style={styles.mainNav}>
          <View style={styles.mainNavLinks}>
            <NavItem
              label="Inicio"
              active={view === 'inicio'}
              onPress={() => {
                onChangeView('inicio');
                if (isCompact) setMenuOpen(false);
              }}
            />
            {!isTransportistaArea ? (
              <>
                <NavItem
                  label="Enviar un paquete"
                  active={view === 'enviar'}
                  onPress={() => {
                    onChangeView('enviar');
                    if (isCompact) setMenuOpen(false);
                  }}
                />
                <NavItem
                  label="Cotizar transporte"
                  active={view === 'cotizar'}
                  onPress={() => {
                    onChangeView('cotizar');
                    if (isCompact) setMenuOpen(false);
                  }}
                />
                <NavItem
                  label="Seguimiento"
                  active={view === 'seguimiento'}
                  onPress={() => {
                    onChangeView('seguimiento');
                    if (isCompact) setMenuOpen(false);
                  }}
                />
              </>
            ) : null}
            {isTransportista ? (
              <NavItem
                label="Perfil"
                active={view === 'perfil'}
                onPress={() => {
                  onChangeView('perfil');
                  if (isCompact) setMenuOpen(false);
                }}
              />
            ) : null}
          </View>

          {!isTransportistaArea ? (
            <View style={styles.trackingMiniWrap}>
              <TextInput
                value={trackingSearch}
                onChangeText={onTrackingChange}
                placeholder="N° seguimiento"
                style={styles.trackingMiniInput}
              />
              <Pressable style={styles.trackingMiniBtn} onPress={onTrackingSubmit}>
                <Text style={styles.trackingMiniBtnText}>Buscar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <Modal visible={isCompact && menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
        <View style={styles.mobileFloatingMenu}>
          <View style={styles.mobileNavLinks}>
            <NavItem
              label="Inicio"
              active={view === 'inicio'}
              onPress={() => {
                onChangeView('inicio');
                setMenuOpen(false);
              }}
            />
            {!isTransportistaArea ? (
              <>
                <NavItem
                  label="Enviar un paquete"
                  active={view === 'enviar'}
                  onPress={() => {
                    onChangeView('enviar');
                    setMenuOpen(false);
                  }}
                />
                <NavItem
                  label="Cotizar transporte"
                  active={view === 'cotizar'}
                  onPress={() => {
                    onChangeView('cotizar');
                    setMenuOpen(false);
                  }}
                />
                <NavItem
                  label="Seguimiento"
                  active={view === 'seguimiento'}
                  onPress={() => {
                    onChangeView('seguimiento');
                    setMenuOpen(false);
                  }}
                />
              </>
            ) : null}
            {isTransportista ? (
              <NavItem
                label="Perfil"
                active={view === 'perfil'}
                onPress={() => {
                  onChangeView('perfil');
                  setMenuOpen(false);
                }}
              />
            ) : null}
          </View>
          {isTransportista ? (
            <Pressable
              onPress={() => {
                onChangeView('perfil');
                setMenuOpen(false);
              }}
            >
              <Text style={styles.mobileLogin}>Mi perfil</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => {
                  onUsuarioAuthPress();
                  setMenuOpen(false);
                }}
              >
                <Text style={styles.mobileLogin}>Regístrate / Iniciar sesión</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onToggleTransportista();
                  setMenuOpen(false);
                }}
              >
                <Text style={styles.mobileTransportista}>¿Eres transportista? Entra aquí</Text>
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

function NavItem({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.navItem, active && styles.navItemActive]} onPress={onPress}>
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, position: 'relative', zIndex: 5 },
  topLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#f1f5ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  topLink: { color: '#334155', fontWeight: '600', fontSize: 12 },
  transportistaLink: { paddingHorizontal: 2, paddingVertical: 1 },
  transportistaText: { color: '#0057ff', fontWeight: '800' },
  header: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbe5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#0057ff', fontSize: 28, fontWeight: '900', letterSpacing: 1.2 },
  subtitle: { color: '#475569', fontWeight: '600' },
  login: { color: '#0057ff', fontWeight: '700'},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  burgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  burgerIcon: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  mainNav: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dbe5f5',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainNavLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  mobileNavLinks: { flexDirection: 'column', gap: 8 },
  navItem: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  navItemActive: { backgroundColor: '#0057ff' },
  navText: { color: '#0f172a', fontWeight: '700' },
  navTextActive: { color: 'white' },
  trackingMiniWrap: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    maxWidth: 320,
  },
  trackingMiniInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  trackingMiniBtn: {
    backgroundColor: '#0057ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingMiniBtnText: { color: 'white', fontWeight: '700' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  mobileFloatingMenu: {
    position: 'absolute',
    top: 96,
    right: 20,
    width: 260,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dbe5f5',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  mobileLogin: { color: '#0057ff', fontWeight: '700', marginTop: 4 },
  mobileTransportista: { color: '#64748b', fontWeight: '600', marginTop: 4, fontSize: 12 },
});
