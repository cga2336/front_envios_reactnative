// ============================================================
// Tipos y utilitarios de tipo compartidos del dominio
// ============================================================
// Centraliza TODOS los tipos usados por componentes, servicios
// y utilidades. Cuando agregues un nuevo tipo de dominio,
// colócalo en la sección correspondiente y expórtalo.
// ============================================================

// ------------------------------------------------------------------
// Tipos base / primitivos del dominio
// ------------------------------------------------------------------

export type MeasurementUnit = 'm' | 'cm';

// ------------------------------------------------------------------
// Envíos
// ------------------------------------------------------------------

export type ShipmentStatus = 'Creado' | 'En ruta' | 'Entregado';

export type Shipment = {
  trackingNumber: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  rut: string;
  shippingAddress: string;
  shippingAddressNumber?: string;
  pickupPoint: string;
  paymentType?: string;
  length?: string;
  width?: string;
  lengthUnit?: MeasurementUnit;
  widthUnit?: MeasurementUnit;
  squareMeters?: number;
  total?: number;
  status: ShipmentStatus;
  createdAt: string;
};

// ------------------------------------------------------------------
// Cotización
// ------------------------------------------------------------------

export type QuoteData = {
  origin: string;
  destination: string;
  length: string;
  width: string;
  lengthUnit: MeasurementUnit;
  widthUnit: MeasurementUnit;
  squareMeters: number;
  total: number;
};

export type TransportQuote = {
  squareMeters: number;
  total: number;
};

// ------------------------------------------------------------------
// Direcciones (Nominatim / OpenStreetMap)
// ------------------------------------------------------------------

export type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  service_road?: string;
  house_number?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

export type AddressResult = {
  display_name: string;
  type?: string;
  address?: NominatimAddress;
};

export type CityOption = {
  label: string;
  full: string;
  value: string;
};

// ------------------------------------------------------------------
// Navegación / vistas del portal
// ------------------------------------------------------------------

export type ViewKey =
  | 'inicio'
  | 'enviar'
  | 'cotizar'
  | 'seguimiento'
  | 'perfil'
  | 'registro-transportista'
  | 'login-transportista'
  | 'registro-usuario'
  | 'login-usuario';

// ------------------------------------------------------------------
// Usuarios
// ------------------------------------------------------------------

export type RegisterUsuarioPayload = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
};

export type LoginUsuarioPayload = {
  email: string;
  password: string;
};

export type UsuarioProfile = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  created_at: string;
};

export type UsuarioSession = {
  token: string;
  usuario: UsuarioProfile;
};

// ------------------------------------------------------------------
// Transportistas
// ------------------------------------------------------------------

export type RegisterTransportistaPayload = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rut: string;
  password: string;
  licenciaConducir?: string;
  camionPatente?: string;
  camionTipo?: string;
  camionCapacidadM3?: number;
  regionBase?: string;
  googleSub?: string;
};

export type TransportistaProfile = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  rut: string | null;
  licencia_conducir: string | null;
  camion_patente: string | null;
  camion_tipo: string | null;
  camion_capacidad_m3: string | null;
  region_base: string | null;
  created_at: string;
};

// Completa el perfil de un transportista creado con Google.
// Exige teléfono, RUT y los datos del vehículo; la licencia es opcional.
export type CompleteProfilePayload = {
  telefono: string;
  rut: string;
  licenciaConducir?: string;
  camionPatente: string;
  camionTipo: string;
  camionCapacidadM3: number;
  regionBase: string;
};

export type TransportistaSession = {
  token: string;
  transportista: TransportistaProfile;
};

// ------------------------------------------------------------------
// Autenticación con Google
// ------------------------------------------------------------------

export type GoogleAuthRole = 'usuario' | 'transportista';

export type GoogleAuthInput = {
  role: GoogleAuthRole;
  idToken?: string | null;
  accessToken?: string | null;
  clientId?: string;
};

export type GoogleDatos = {
  sub: string;
  email: string;
  nombre: string;
  apellido: string;
};

export type GoogleAuthResponse = {
  message: string;
  token?: string;
  usuario?: UsuarioProfile;
  transportista?: TransportistaProfile;
  vinculado?: boolean;
  vehiculoRegistrado?: boolean;
  googleDatos?: GoogleDatos;
};

export type GoogleCredentialResult = {
  idToken: string | null;
  accessToken: string | null;
  clientId: string;
};

// ------------------------------------------------------------------
// Errores / formularios
// ------------------------------------------------------------------

export type FieldErrorMap<TKeys extends string = string> = Partial<Record<TKeys, string>>;

// Alias específicos para mantener legibilidad en componentes.
export type LoginFieldErrors = FieldErrorMap<'email' | 'password'>;

// ------------------------------------------------------------------
// Respuestas internas de servicios (API)
// ------------------------------------------------------------------

export type RegisterUsuarioResponse = {
  message: string;
  usuario: UsuarioProfile;
};

export type LoginUsuarioResponse = {
  message: string;
  token: string;
  usuario: UsuarioProfile;
};

export type RegisterTransportistaResponse = {
  message: string;
  transportista: TransportistaProfile;
};

export type LoginTransportistaResponse = {
  message: string;
  token: string;
  transportista: TransportistaProfile;
};

export type UpdateTransportistaPerfilResponse = {
  message: string;
  transportista: TransportistaProfile;
};

// ------------------------------------------------------------------
// Propiedades (Props) compartidas de componentes
// ------------------------------------------------------------------

export type HeaderProps = {
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

export type ShipmentFormProps = {
  onShipmentCreated: (shipment: Shipment) => void;
  initialQuote?: QuoteData | null;
  onSubmitEnabledChange?: (enabled: boolean) => void;
  onProgressChange?: (progress: number) => void;
};

export type QuoteCalculatorProps = {
  onSendQuote?: (quote: QuoteData) => void;
};

export type TrackingPanelProps = {
  shipments: Shipment[];
};

export type UsuarioLoginFormProps = {
  onSuccess: (session: UsuarioSession) => void;
  onRegisterPress: () => void;
  notice?: string;
};

export type UsuarioRegisterFormProps = {
  onSuccess: (session?: UsuarioSession) => void;
};

export type TransportistaLoginFormProps = {
  onSuccess: (session: TransportistaSession) => void;
  onRegisterPress: () => void;
  notice?: string;
};

export type TransportistaRegisterFormProps = {
  onSuccess: (session?: TransportistaSession) => void;
};

export type TransportistaProfileFormProps = {
  transportista: TransportistaProfile;
  token: string;
  onSaved: (updated: TransportistaProfile) => void;
};

// ------------------------------------------------------------------
// Componentes legacy / no usados activamente por PortalApp
// ------------------------------------------------------------------

export type LegacySidebarViewKey = 'home' | 'generar-envio' | 'seguimiento';

export type SidebarMenuProps = {
  selected: LegacySidebarViewKey;
  onSelect: (v: LegacySidebarViewKey) => void;
  mobile?: boolean;
};
