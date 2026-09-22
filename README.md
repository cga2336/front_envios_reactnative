# Portal híbrido de envíos (`frontend`)

Aplicación híbrida construida con **React Native + Expo + React Native Web**. Es la interfaz de cliente y transportista de un portal de envíos nacional en Chile.

> Este documento está pensado para que un agente de código comprenda rápidamente el contexto, arquitectura y convenciones del proyecto.

## 1. Tecnologías y herramientas

| Tecnología | Uso |
|---|---|
| React Native 0.76.9 | UI multiplataforma |
| Expo SDK ~57.0.0 | Dev server, bundler Metro, autenticación, navegador web |
| React Native Web ~0.19.13 | Render web dentro del mismo código base |
| TypeScript ^5.6.2 | Tipado estricto (`strict: true`) |
| AsyncStorage / `localStorage` | Persistencia local de sesiones y envíos |
| `expo-auth-session` + `expo-web-browser` | OAuth con Google |

## 2. Propósito del proyecto

Portal de envíos que permite a **usuarios/clientes** cotizar y generar envíos, y a **transportistas** registrarse, iniciar sesión y gestionar su perfil/vehículo. Actualmente el frontend también administra localmente el estado de los envíos del usuario (no hay backend de tracking real en esta capa). Trabaja contra una API REST interna que por defecto corre en `localhost:4000`.

## 3. Scripts disponibles

```bash
npm install
npm run start      # Inicia el dev server de Expo
npm run web        # Inicia solo la versión web
npm run android    # Compila/inicia Android
npm run ios        # Compila/inicia iOS (requiere macOS + Xcode)
```

## 4. Variables de entorno

El frontend las lee desde las variables públicas de Expo:

- `EXPO_PUBLIC_API_URL` — Base URL de la API REST (default: `http://localhost:4000`, Android emulator: `http://10.0.2.2:4000`).
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — Client ID de Google para web.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — Client ID de Google para iOS.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — Client ID de Google para Android.

Ver lógica en:
- `src/services/api.ts` para la URL base.
- `src/features/useGoogleAuth.ts` para los client IDs de Google.

## 5. Estructura de carpetas

```
frontend/
├── App.tsx                      # Punto de entrada raíz. SafeAreaView + StatusBar + PortalApp.
├── app.json                     # Configuración de Expo (slug fronend, scheme moon, plataformas ios/android/web).
├── babel.config.js              # Configuración de Babel/Metro.
├── tsconfig.json                # Extiende expo/tsconfig.base con strict: true.
└── src/
    ├── core/
    │   └── PortalApp.tsx        # Componente principal. Maneja vistas, sesiones, envíos, navegación y layout.
    ├── components/
    │   ├── Header.tsx           # Header + navegación principal + menú móvil (compacto <900px).
    │   └── SidebarMenu.tsx      # Menú lateral/móvil legado (no usado actualmente por PortalApp).
    ├── features/
    │   ├── QuoteCalculator.tsx      # Cotizador origen/destino/dimensiones.
    │   ├── ShipmentForm.tsx         # Formulario de generación de envío + búsqueda de direcciones.
    │   ├── TrackingPanel.tsx        # (legacy) panel de seguimiento.
    │   ├── UsuarioLoginForm.tsx     # Login de usuario.
    │   ├── UsuarioRegisterForm.tsx  # Registro de usuario.
    │   ├── TransportistaLoginForm.tsx    # Login de transportista.
    │   ├── TransportistaRegisterForm.tsx # Registro de transportista.
    │   ├── TransportistaProfileForm.tsx  # Completar/editar perfil y vehículo.
    │   └── useGoogleAuth.ts            # Hook de autenticación con Google.
    ├── services/
    │   ├── api.ts                 # `API_BASE_URL` con fallback por plataforma.
    │   ├── usuarioApi.ts          # Login/registro de usuarios.
    │   ├── transportistaApi.ts    # Login/registro/perfil de transportistas.
    │   └── googleAuthApi.ts       # Envío de credenciales Google al backend.
    ├── utils/
    │   ├── quote.ts               # Cálculo de cotización: $20.000 CLP por m².
    │   ├── authStorage.ts         # Persistencia de sesiones usuario/transportista.
    │   └── shipmentStorage.ts     # Persistencia de envíos y generador de tracking number.
    └── types.ts                   # Tipos compartidos del dominio.
```

## 6. Arquitectura y flujo

- `App.tsx` monta `PortalApp`.
- `PortalApp` administra:
  - El estado de vista (`ViewKey`): `inicio`, `enviar`, `cotizar`, `seguimiento`, `perfil`, `login-transportista`, `registro-transportista`, `login-usuario`, `registro-usuario`.
  - Sesiones de **usuario** y **transportista** (cargadas desde `authStorage` al iniciar).
  - Lista de envíos generados (`shipmentStorage`) y búsqueda de seguimiento local.
  - Handlers de login, registro y cierre de sesión.
- El menú principal vive en `Header.tsx`. Es responsivo:
  - Web ancha (`>=900px`): barra superior + navegación horizontal + buscador de seguimiento.
  - Móvil: menú hamburguesa con Modal.
- Regla de negocio para transportistas: al iniciar sesión, si no tienen vehículo registrado (`!camion_patente`), se redirige a la vista `perfil` para completar datos.

## 7. Módulos principales

### 7.1 Inicio (`inicio`)
Hero con cotizador, accesos rápidos, secciones promocionales, banner 24/7 y footer.

### 7.2 Cotizar transporte (`QuoteCalculator`)
- Campos: origen, destino, largo, ancho.
- Búsqueda de ciudades/comunas vía Nominatim (OpenStreetMap), solo Chile (`countrycodes=cl`).
- Unidades `m`/`cm`.
- Tarifa: `$20.000 CLP/m²`.
- Permite pasar la cotización al formulario de envío.

### 7.3 Enviar paquete (`ShipmentForm`)
- Paso 1 — Datos del cliente: nombre, apellido, correo, celular, RUT, dirección de envío (búsqueda Nominatim), número de dirección, forma de pago (online/presencial/por pagar) y punto de retiro.
- Paso 2 — Datos del transporte: largo/ancho, cotización y envío.
- Validaciones locales: email chileno básico, celular de 8-9 dígitos, RUT chileno, campos obligatorios.
- Al crear el envío genera un `trackingNumber`, lo guarda localmente y redirige a seguimiento.

### 7.4 Seguimiento
Búsqueda local por número de envío contra `shipments` almacenados. Muestra estado, fecha, cliente, dirección, pago y total.

### 7.5 Autenticación
- Usuarios y transportistas tienen flujos separados: login/registro manual + Google OAuth.
- Los formularios delegan la llamada a `usuarioApi` / `transportistaApi` / `googleAuthApi`.
- `useGoogleAuth` devuelve `prompt`, `result`, `error`. Si no hay client IDs configurados, muestra error sin romper la app.
- La sesión (token + perfil) se guarda en `AsyncStorage`/`localStorage`.

## 8. Convenciones importantes

- **Estilos**: ` StyleSheet.create()` a pie de componente. Uso intensivo de `Platform.OS === 'web'` para layouts de escritorio.
- **Navegación**: es propia del estado (sin React Navigation). Toda navegación ocurre por `setView` en `PortalApp`.
- **Tipos**: centralizados en `src/types.ts`. Nombrados en español para reflejar el dominio del negocio.
- **Persistencia**: usa `Platform.OS === 'web' ? localStorage : AsyncStorage`.
- **Comunicación API**: fetch con `Authorization: Bearer <token>` para endpoints protegidos.
- **Google Auth**: requiere variables de entorno. Sin ellas el hook falla graceful y explica cómo configurarlo.

## 9. Consideraciones técnicas / deuda conocida

- `SidebarMenu.tsx` es un componente legado con ViewKeys distintos (`home`, `generar-envio`, `seguimiento`) y no está integrado actualmente en `PortalApp`.
- `TrackingPanel.tsx` tampoco es usado por `PortalApp`; el seguimiento se renderiza inline en `PortalApp`.
- El frontend asume backend en `localhost:4000` por defecto.
- El formulario de envío usa `<br></br>` dentro del JSX para separación visual (solo web).
- Validaciones son principalmente locales; el RUT valida dígito verificador.

## 10. Cómo empezar como agente

1. Verifica que `package.json` refleje el estado actual (Expo 57, RN 0.76, etc.).
2. Para correr en web: `npm install && npm run web`.
3. Para conectar con el backend revisa/proporciona `EXPO_PUBLIC_API_URL`.
4. Para Google OAuth configura `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (y las variantes móviles si aplica).
5. Antes de modificar `PortalApp`/`Header` revisa los `ViewKey` soportados; nuevas vistas deben añadirse a ambos.
6. Antes de tocar `src/types.ts` revisa los consumidores en `services/*Api.ts` y `utils/*Storage.ts`.
