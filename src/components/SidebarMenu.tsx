import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export type ViewKey = 'home' | 'generar-envio' | 'seguimiento';

type Props = {
  selected: ViewKey;
  onSelect: (v: ViewKey) => void;
  mobile?: boolean;
};

export function SidebarMenu({ selected, onSelect, mobile = false }: Props) {
  const isWebSidebar = Platform.OS === 'web' && !mobile;

  return (
    <View style={[styles.wrap, isWebSidebar ? styles.sidebar : styles.mobileBar]}>
      <Text style={styles.menuTitle}>Menú</Text>
      <View style={styles.items}>
        <MenuButton label="Generar envío" active={selected === 'generar-envio'} onPress={() => onSelect('generar-envio')} />
        <MenuButton label="Cotizar transporte" active={selected === 'home'} onPress={() => onSelect('home')} />
        <MenuButton label="Seguimiento" active={selected === 'seguimiento'} onPress={() => onSelect('seguimiento')} />
      </View>
    </View>
  );
}

function MenuButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.btn, active && styles.btnActive]} onPress={onPress}>
      <Text style={[styles.btnText, active && styles.btnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  sidebar: {
    width: 250,
    backgroundColor: '#0f172a',
    padding: 12,
  },
  mobileBar: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 8,
  },
  menuTitle: { color: Platform.OS === 'web' ? '#e2e8f0' : '#0f172a', fontWeight: '700' },
  items: { gap: 8, flexDirection: Platform.OS === 'web' ? 'column' : 'row', flexWrap: 'wrap' },
  btn: { backgroundColor: '#1e293b', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnActive: { backgroundColor: '#2563eb' },
  btnText: { color: '#e2e8f0', fontWeight: '600' },
  btnTextActive: { color: 'white' },
});
