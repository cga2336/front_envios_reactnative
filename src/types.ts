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
  lengthUnit?: 'm' | 'cm';
  widthUnit?: 'm' | 'cm';
  squareMeters?: number;
  total?: number;
  status: ShipmentStatus;
  createdAt: string;
};

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

export type QuoteData = {
  origin: string;
  destination: string;
  length: string;
  width: string;
  lengthUnit: 'm' | 'cm';
  widthUnit: 'm' | 'cm';
  squareMeters: number;
  total: number;
};

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

// Completa el perfil de un transportista creado con Google: exige teléfono,
// RUT y los datos del vehículo (obligatorios); la licencia es opcional.
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

export type RegisterUsuarioPayload = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
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
