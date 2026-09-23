# Portal híbrido de envíos — Frontend

Frontend del **portal de envíos y transporte** implementado como app **hibrida** con **React Native + Expo + React Native Web**: el mismo código corre en **web (browser), iOS y Android**.

Este README está pensado para que un agente (IA) o desarrollador nuevo comprenda el contexto del proyecto sin intervención humana.

---

## 1. Contexto del proyecto

El repositorio raíz `envios_transportes/` contiene:

| Carpeta | Rol |
|---|---|
| `frontend/` | **Este proyecto** — app híbrida (Expo / React Native / Web) |
| `backend/` | API REST (Node.js + Express) con PostgreSQL vía Supabase |
| `funcionalidades.md` | Especificación funcional de alto nivel (fuente de verdad del negocio) |
| `opencode.jsonc` | Configuración de OpenCode (modelo `ollama/qwen3:8b`) |

### Especificación funcional (resumen de `funcionalidades.md`)

- **Usuario final** puede:
  - Crear un envío completando un formulario con campos obligatorios (nombre, apellido, correo, celular, RUT, dirección de envío con búsqueda, punto de entrega, punto de retiro).
  - Cotizar transporte indicando origen, destino y dimensiones (largo × ancho). El valor por **metro cuadrado** es de **$20.000 CLP**.
  - Rastrear un envío por su **N° de seguimiento**.
- **Transportista** (conductor) puede:
  - Darse de alta (registro/login, incluido flujo con Google).
  - Completar su perfil con datos personales y de vehículo/camión (obligatorio para operar).
  - (Planificado en la especificación: crear consolidados/viajes con pago de compromiso, dashboard de trabajos — aún no implementado en este frontend).

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **Expo ~57** (`expo` SDK 57) |
| UI | **React Native 0.76.9** |
| Web | **react-native-web ~0.19.13** + `@expo/metro-runtime` |
| Lenguaje | **TypeScript** (`strict: true`, `expo/tsconfig.base`) |
| Persistencia local | `@react-native-async-storage/async-storage` (nativo) / `localStorage` (web) |
| Auth OAuth | `expo-auth-session` + `expo-web-browser` (Google Sign-In) |
| Búsqueda de direcciones | **Nominatim (OpenStreetMap)** — solo Chile (`countrycodes=cl`, `accept-language=es`) |
| Navegación | No usa react-navigation: navegación por **estado local de vistas** (`PortalApp`) |

Scripts disponibles (`package.json`):

```bash
npm run start     # expo start
npm run android   # expo run:android
npm run ios       # expo run:ios
npm run web       # expo start --web
```

---

## 3. Arquitectura y estructura del código

```
App.tsx                        → entrada; monta <PortalApp/> en SafeAreaView
src/
├── core/PortalApp.tsx         → orquestador principal: estado de sesión, vistas,
│                                envíos, tracking y composición de pantallas
├── components/
│   ├── Header.tsx             → header responsive (nav desktop + menú móvil modal)
│   └── SidebarMenu.tsx        → menú lateral (web)
├── features/                  → una carpeta/archivo por módulo de UI
│   ├── QuoteCalculator.tsx    → cotización de transporte (origen, destino, dimensiones)
│   ├── ShipmentForm.tsx       → formulario de envío (2 pasos: cliente → transporte)
│   ├── TrackingPanel.tsx      → seguimiento por N° de envío
│   ├── UsuarioLoginForm.tsx / UsuarioRegisterForm.tsx
│   ├── TransportistaLoginForm.tsx / TransportistaRegisterForm.tsx / TransportistaProfileForm.tsx
│   └── useGoogleAuth.ts       → hook de Google OAuth (expo-auth-session)
├── services/                  → capa HTTP hacia el backend
│   ├── api.ts                 → resuelve API_BASE_URL
│   ├── usuarioApi.ts          → register/login de usuarios
│   ├── transportistaApi.ts    → register/login + update perfil
│   └── googleAuthApi.ts       → POST /api/v1/auth/google (intercambio de token)
├── utils/
│   ├── quote.ts               → cálculo de tarifa (CLP_PER_SQUARE_METER = 20_000)
│   ├── authStorage.ts         → persistencia de sesiones (usuario/transportista)
│   └── shipmentStorage.ts     → persistencia de envíos + generación de tracking
├── pages/                     → (vacío por ahora, reservado)
└── types.ts                   → tipos compartidos de todo el dominio
```

### Navegación por vistas (`ViewKey` en `PortalApp.tsx`)

`inicio` · `enviar` · `cotizar` · `seguimiento` · `perfil` · `registro-transportista` · `login-transportista` · `registro-usuario` · `login-usuario`

La vista activa se maneja con `useState` en `PortalApp`; `Header` recibe callbacks para cambiar de vista. No hay router.

### Reglas de negocio implementadas en el frontend

#### Reglas globales (aplican a web + móvil)

- **Transportista sin vehículo**: al hacer login/registro con Google, si no tiene `camion_patente` se le fuerza a `perfil` para completar teléfono, RUT y datos del camión (ver `handleTransportistaLogin`).
- **Cotización precargada en envío**: desde el cotizador se puede pasar `quoteDraft` al formulario; el origen de la cotización se usa como dirección de envío y el destino como punto de entrega.
- **Validación de formulario**: email, teléfono chileno y RUT (dígito verificador) se validan en `ShipmentForm.tsx`.
- **Estado del envío**: `'Creado' | 'En ruta' | 'Entregado'` (por ahora los envíos se crean localmente y persisten solo en el dispositivo; **no** se envían al backend).
- **Cotización rápida es opcional**: el usuario puede cotizar en la vista `cotizar` sin completar el formulario de `enviar`; se presenta como atajo para estimar costo.

#### Reglas específicas de móvil (web en pantalla compacta / dispositivo móvil)

- **Header móvil de autenticación**:
  - Si hay sesión de **usuario**, `Regístrate / Iniciar sesión` cambia a `Cerrar sesión` y ejecuta cierre real de sesión.
  - Si hay sesión de **usuario**, se oculta `¿Eres transportista? Entra aquí`.
  - Al cerrar sesión de usuario, el enlace de transportista vuelve a mostrarse.
  - Si hay sesión de **transportista**, el menú muestra `Mi perfil` y `Cerrar sesión`.
- **Vista `enviar` en móvil**:
  - Se prioriza el **formulario completo** en pantalla (no se muestra el bloque de imagen).
  - Debajo se muestra un bloque **Resumen rápido del envío** con estado y progreso.
- **Barra de progreso del resumen móvil**:
  - **Con cotización previa (`quoteDraft`)**: inicia con avance base (>0%) y completa al 100% al finalizar datos requeridos.
  - **Sin cotización previa**: inicia en 0% y sube progresivamente al completar datos del formulario y luego medidas de carga.
  - Si se pierde la condición de envío (ej. deja de haber medidas válidas), el progreso vuelve a recalcularse (no se mantiene forzado en 100%).

#### Reglas específicas de web escritorio

- **Vista `enviar` desktop**: mantiene layout de dos columnas (slot de imagen + formulario).
- **Navegación desktop**: se usa barra superior y navegación principal expandida (sin menú hamburguesa modal).

---

## 4. Contratos con el backend

Base URL: `EXPO_PUBLIC_API_URL` o fallback por plataforma (`http://10.0.2.2:4000` en Android emulador, `http://localhost:4000` en el resto). Ver `src/services/api.ts`.

| Método | Ruta | Función frontend | Autorización |
|---|---|---|---|
| POST | `/api/v1/usuarios/register` | `registerUsuario` | — |
| POST | `/api/v1/usuarios/login` | `loginUsuario` | — |
| POST | `/api/v1/transportistas/register` | `registerTransportista` | — |
| POST | `/api/v1/transportistas/login` | `loginTransportista` | — |
| PUT | `/api/v1/transportistas/:id/perfil` | `updateTransportistaPerfil` | `Bearer <token>` |
| POST | `/api/v1/auth/google` | `googleAuthSession` | — |

En caso de error, el backend responde con `{ message: string }`; el frontend lanza `Error(message)`.

**Auth con Google** (`src/features/useGoogleAuth.ts` + `src/services/googleAuthApi.ts`):
1. Se obtienen credenciales (`idToken` / `accessToken`) con `expo-auth-session` según la plataforma.
2. Se envían a `/api/v1/auth/google` indicando `role: 'usuario' | 'transportista'`.
3. Si el transportista no tiene vehículo registrado, la respuesta incluye `vinculado/vehiculoRegistrado` para completar perfil.

### Tipos clave (`src/types.ts`)

- `Shipment` — envío con tracking, datos del cliente, medidas, `status`, `createdAt`.
- `QuoteData` — cotización (origen, destino, dimensiones, `squareMeters`, `total`).
- `TransportistaSession` / `UsuarioSession` — `{ token, transporte|usuario }`.
- `CompleteProfilePayload` — payload obligatorio para completar perfil de transportista.

---

## 5. Configuración de entorno (`.env`)

**El archivo `.env` está en `.gitignore`; no versionar credenciales.** Variables utilizadas:

```bash
# URL de la API backend (si está vacía se usa localhost:4000)
EXPO_PUBLIC_API_URL=http://localhost:4000

# Client IDs de OAuth 2.0 de Google Cloud Console (uno por tipo de app)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```

En la misma carpeta existe `.env.prod` con una credencial Supabase en texto plano. **Se recomienda eliminarla del directorio y rotar la contraseña**, ya que no debería vivir ni siquiera en un archivo local (aunque esté gitignored). Los prefijos `EXPO_PUBLIC_` son los únicos que Expo expone al bundle del cliente.

---

## 6. Persistencia local

| Dato | Web | iOS/Android |
|---|---|---|
| Sesión transportista (`transportista_session`) | `localStorage` | `AsyncStorage` |
| Sesión usuario (`usuario_session`) | `localStorage` | `AsyncStorage` |
| Envíos (`shipments`) | `localStorage` | `AsyncStorage` |

N° de seguimiento generado en `createTrackingNumber()` con formato `ENV-YYYYMMDD-XXXX`.

---

## 7. Ejecutar el proyecto

```bash
cd frontend
npm install
npm run start
```

Luego en la terminal de Expo:
- `w` → abrir en navegador (web)
- `a` → Android (emulador o dispositivo)
- `i` → iOS (macOS con Xcode)

Para probar contra el backend local, asegúrate de que corra en `http://localhost:4000` (o configura `EXPO_PUBLIC_API_URL`). En el emulador de Android el fallback automático es `10.0.2.2:4000`.

---

## 8. Convenciones y advertencias conocidas

- **Nombre del paquete**: `package.json` tiene `"name": "fronend"` (typo histórico) y `app.json` usa `slug: "fronend"`. La marca visible en el header es **"MOON"** y el nombre de la app es "Portal Envíos". **No "corregir" estos identificadores sin confirmación**: romperían deep links, EAS y el bundle identifier actual (`com.moon.portal` / `com.mooon.portal`).
- **Sin commits aún**: el repo git en `main` no tiene commits iniciales; es un proyecto en fase inicial de desarrollo.
- `src/pages/` y `src/components/layout/` existen pero están **vacíos** (reservados).
- **Seguimiento**: consulta únicamente envíos **locales** (persistidos en el dispositivo); el backend aún no expone endpoints de envíos/tracking.
- El cotizador usa **largo × ancho (m²)** para la tarifa, a pesar de que la especificación habla de "m³". El costo está centralizado en `CLP_PER_SQUARE_METER = 20_000` (`src/utils/quote.ts`).
- Búsqueda de direcciones usa **Nominatim** de OpenStreetMap, con límite de 6 resultados y filtro `countrycodes=cl`; respetar su política de uso (no hacer spam de requests).
- Comentarios y mensajes de UI están en **español**; mantener ese idioma en las contribuciones.
- Tipado estricto: al tocar `types.ts`, actualizar también services/formularios que consumen esos tipos.

---

## 9. Definition of Done (para agentes que modifiquen este proyecto)

- [ ] `tsc` sin errores (`npx tsc --noEmit`).
- [ ] App arranca en web (`npm run web`) sin errores de bundling.
- [ ] Si se cambió un contrato de API, actualizar `src/services/*.ts` y `src/types.ts` en sincronía con `backend/`.
- [ ] Si se cambió la vista/navegación, actualizar `ViewKey` y los callbacks de `Header`.
- [ ] No versionar `.env*` ni credenciales.
- [ ] Mantener documentación (este README) al día si cambia la estructura o el stack.
