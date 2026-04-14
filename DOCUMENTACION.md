# 📖 Documentación Completa — Modelorama Coalcomán

> **Versión:** 2.0  
> **Última actualización:** Marzo 2026  
> **Tipo de proyecto:** Aplicación Web Progresiva (PWA)  
> **Stack tecnológico:** HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5, Firebase (Firestore + Storage), Leaflet Maps

---

## 📑 Índice

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Proyecto](#2-arquitectura-del-proyecto)
3. [Estructura de Archivos](#3-estructura-de-archivos)
4. [Tecnologías y Dependencias](#4-tecnologías-y-dependencias)
5. [Módulos del Sistema](#5-módulos-del-sistema)
   - 5.1 [Página Principal (index.html)](#51-página-principal)
   - 5.2 [Panel de Administración (admin.html)](#52-panel-de-administración)
   - 5.3 [Catálogo de Productos (products.js)](#53-catálogo-de-productos)
   - 5.4 [Lógica Principal (script.js)](#54-lógica-principal)
   - 5.5 [Panel Admin (admin.js)](#55-panel-admin)
   - 5.6 [Mapa de Entrega (map.js)](#56-mapa-de-entrega)
   - 5.7 [Configuración Firebase (firebase-config.js)](#57-configuración-firebase)
   - 5.8 [Estilos (styles.css)](#58-sistema-de-diseño)
   - 5.9 [Service Worker (sw.js)](#59-service-worker--pwa)
6. [Base de Datos (Firebase Firestore)](#6-base-de-datos)
7. [Flujos de Usuario](#7-flujos-de-usuario)
8. [Funcionalidades Detalladas](#8-funcionalidades-detalladas)
9. [Configuración y Despliegue](#9-configuración-y-despliegue)
10. [Seguridad](#10-seguridad)
11. [API y Funciones Globales](#11-api-y-funciones-globales)

---

## 1. Descripción General

**Modelorama Coalcomán** es una aplicación web progresiva (PWA) diseñada para una sucursal de Modelorama ubicada en Coalcomán, Michoacán, México. Permite a los clientes:

- Explorar un catálogo de productos (cervezas, licores, botanas y extras)
- Agregar productos a un carrito de compras
- Enviar pedidos directamente por **WhatsApp**
- Ver promociones destacadas
- Compartir su ubicación GPS para entregas a domicilio

El sistema incluye un **Panel de Administración** completo para gestionar productos, categorías, paquetes/combos y configuraciones del negocio, todo sincronizado en tiempo real mediante **Firebase Firestore**.

---

## 2. Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                   │
├──────────────────────┬──────────────────────────────────┤
│   Página Principal   │     Panel de Administración      │
│    (index.html)      │        (admin.html)              │
├──────────────────────┴──────────────────────────────────┤
│              JavaScript (Vanilla ES6+)                   │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐ │
│  │script.js │ │products.js│ │ map.js │ │  admin.js    │ │
│  └──────────┘ └──────────┘ └────────┘ └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│              firebase-config.js                          │
├─────────────────────────────────────────────────────────┤
│                 Firebase (Backend)                        │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  Cloud Firestore  │  │   Firebase Storage           │ │
│  │  (Base de datos)  │  │   (Imágenes de productos)    │ │
│  └──────────────────┘  └──────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              APIs Externas                               │
│  ┌────────────┐ ┌───────────┐ ┌──────────────────────┐ │
│  │  WhatsApp  │ │ Leaflet   │ │  CDNs (Bootstrap,    │ │
│  │  API       │ │ Maps      │ │  SweetAlert2, etc.)  │ │
│  └────────────┘ └───────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Patrón de arquitectura:** Cliente-servidor con Firebase como BaaS (Backend as a Service). No hay servidor backend propio; toda la lógica se ejecuta en el navegador y la persistencia se delega a Firestore.

---

## 3. Estructura de Archivos

```
📁 TEST/
├── 📄 index.html                    → Página principal del cliente
├── 📄 admin.html                    → Panel de administración
├── 📄 manifest.json                 → Configuración PWA
├── 📄 sw.js                         → Service Worker (cache offline)
├── 📄 firebase.json                 → Configuración de Firebase Hosting
├── 📄 firestore.rules               → Reglas de seguridad de Firestore
├── 📄 storage.rules                 → Reglas de seguridad de Storage
├── 📄 firebase-config.json          → Configuración exportada de Firebase
├── 📄 firebase-config-clean.json    → Copia limpia de configuración
├── 📄 README_ADMIN.md               → Instrucciones del panel admin
│
├── 📁 css/
│   └── 📄 styles.css                → Sistema de diseño completo
│
├── 📁 js/
│   ├── 📄 firebase-config.js        → Inicialización de Firebase
│   ├── 📄 products.js               → Catálogo, CRUD y sincronización con Firestore
│   ├── 📄 script.js                 → Lógica de la página principal
│   ├── 📄 admin.js                  → Lógica del panel de administración
│   └── 📄 map.js                    → Mapa de entrega con Leaflet
│
├── 📁 img/                          → Imágenes locales (vacío, usa URLs externas)
│
└── 📁 modelorama-vector-logo-seeklogo/
    └── 📄 modelorama-seeklogo.png   → Logo oficial de Modelorama
```

---

## 4. Tecnologías y Dependencias

### Frontend

| Tecnología          | Versión | Uso                                         |
| ------------------- | ------- | ------------------------------------------- |
| **Bootstrap 5**     | 5.3.2   | Framework CSS, componentes UI, grid         |
| **Bootstrap Icons** | 1.11.1  | Iconografía                                 |
| **Leaflet.js**      | 1.9.4   | Mapa interactivo de entrega                 |
| **SweetAlert2**     | 11      | Alertas, toasts y modales premium           |
| **Canvas Confetti** | 1.6.0   | Animación de confetti al agregar al carrito |
| **Google Fonts**    | —       | Tipografías Montserrat y Outfit             |

### Backend / Servicios

| Tecnología                | Uso                                       |
| ------------------------- | ----------------------------------------- |
| **Firebase Firestore**    | Base de datos NoSQL en tiempo real        |
| **Firebase Storage**      | Almacenamiento de imágenes de productos   |
| **Firebase Hosting**      | Hosting de la aplicación                  |
| **Firebase Auth**         | Autenticación segura de administradores   |
| **WhatsApp Business API** | Canal de pedidos (vía URL scheme `wa.me`) |
| **CartoDB/OpenStreetMap** | Tiles del mapa (Voyager theme)            |

### PWA

| Componente          | Archivo                            |
| ------------------- | ---------------------------------- |
| Manifest            | `manifest.json`                    |
| Service Worker      | `sw.js`                            |
| Estrategia de cache | Network-first con fallback a cache |

---

## 5. Módulos del Sistema

### 5.1 Página Principal

**Archivo:** `index.html`

Estructura de secciones:

| Sección                    | Descripción                                                                    |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Top Announcement Bar**   | Barra superior con horario, ubicación y WhatsApp (solo desktop)                |
| **Age Verification Modal** | Modal obligatorio de verificación de edad (+18). Se almacena en `localStorage` |
| **Navbar**                 | Barra de navegación fija con logo, enlaces y botón de carrito                  |
| **Hero Carousel**          | Carrusel de 2 slides con auto-rotación cada 5 segundos                         |
| **Features (Garantía)**    | 3 tarjetas: Garantía de Frío, Precios Oficiales, Servicio Extendido            |
| **Promociones**            | 3 tarjetas de productos en oferta con botón de orden por WhatsApp              |
| **Catálogo**               | Grid dinámico de productos con búsqueda y filtro por categorías                |
| **Contacto**               | Sección con botón de WhatsApp                                                  |
| **Footer**                 | Navegación, legal, copyright                                                   |
| **Cart Offcanvas**         | Panel lateral del carrito de compras                                           |
| **Quick View Modal**       | Vista rápida de producto en modal                                              |
| **Mobile Bottom Nav**      | Navegación inferior para móviles con FAB central                               |
| **Profile Modal**          | Modal para guardar datos del cliente                                           |

---

### 5.2 Panel de Administración

**Archivo:** `admin.html`

Dashboard completo con:

| Componente              | Descripción                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| **Login Overlay**       | Pantalla de autenticación mediante Firebase Auth                     |
| **Dashboard Stats**     | 4 tarjetas: Total Productos, Paquetes, Categorías, Productos Fríos   |
| **Tabs de Navegación**  | Productos, Paquetes, Categorías, Configuración                       |
| **Tabla de Productos**  | Lista editable con búsqueda, imagen, categoría y precio              |
| **Grid de Paquetes**    | Tarjetas de combos con productos incluidos y ahorro                  |
| **Tabla de Categorías** | Lista de categorías con preview de icono/ring style                  |
| **Configuración**       | Creación de admins, contraseñas y Textos Legales                     |
| **Modal de Producto**   | Formulario completo para crear/editar productos con subida de imagen |
| **Modal de Categoría**  | Formulario para crear/editar categorías con selector de iconos       |
| **FAB Móvil**           | Botón flotante contextual según tab activo                           |

---

### 5.3 Catálogo de Productos

**Archivo:** `js/products.js`

Este archivo es el **corazón de datos** de la aplicación. Gestiona:

#### Datos por defecto (seed)

Se incluyen **24 productos** predefinidos en `DEFAULT_PRODUCTS` y **7 categorías** en `DEFAULT_CATEGORIES`.

**Categorías predefinidas:**

| ID         | Nombre   | Orden |
| ---------- | -------- | ----- |
| `corona`   | Corona   | 1     |
| `modelo`   | Modelo   | 2     |
| `victoria` | Victoria | 3     |
| `pacifico` | Pacífico | 4     |
| `licores`  | Licores  | 5     |
| `botanas`  | Botanas  | 6     |
| `otros`    | Extras   | 7     |

**Tipos de productos incluidos:**

- Cervezas (Corona, Modelo, Victoria, Pacífico)
- Licores (Tequila Don Julio, Whisky Buchanan's, Ron Bacardí, Vodka Smirnoff)
- Botanas (Papas, Cacahuates, Ruffles, Doritos, Tostitos)
- Extras (Hielo, Refrescos, Agua mineral, Vasos, Cigarros)

#### Esquema de datos de un producto

```javascript
{
    id: 'corona-extra-media',        // Identificador único
    name: 'Corona Extra Media',      // Nombre del producto
    brand: 'Corona',                 // Marca
    category: 'corona',              // ID de categoría
    price: 24.00,                    // Precio actual
    oldPrice: 28.00,                 // Precio anterior (si hay oferta) | null
    description: 'Media 355ml',      // Descripción corta
    image: 'https://...',            // URL de imagen | ''
    imageIcon: 'bi-cup-straw',       // Icono Bootstrap (fallback si no hay imagen)
    imageColor: 'text-gold',         // Clase CSS de color del icono
    promo: 'OFERTA',                 // Badge: OFERTA|PREMIUM|NUEVO|POPULAR|COMBO | null
    cold: true,                      // ¿Se sirve frío?
    includedProducts: ['id1','id2']   // Solo para paquetes: IDs de productos incluidos
}
```

#### Esquema de datos de una categoría

```javascript
{
    id: 'corona',                    // Identificador único
    name: 'Corona',                  // Nombre visible
    type: 'icon',                    // 'icon' | 'image'
    icon: 'bi-award text-gold',      // Clase Bootstrap Icons (si type='icon') o URL (si type='image')
    ringColor: 'ring-gold',          // Clase CSS del anillo estilo Stories
    order: 1                         // Orden de aparición
}
```

#### Sincronización con Firestore

- **`initData()`**: Inicializa listeners en tiempo real (`onSnapshot`) para las colecciones `products` y `categories`
- **Seeding automático**: Si Firestore está vacío y no se ha hecho seed previamente, carga los datos por defecto
- **Control de seed**: Usa el documento `settings/init` con flags `productsSeeded` y `categoriesSeeded`
- **Eventos globales**: Dispara `productsUpdated` y `categoriesUpdated` cuando hay cambios

#### Funciones CRUD

| Función                       | Descripción                          |
| ----------------------------- | ------------------------------------ |
| `getProducts()`               | Retorna array de todos los productos |
| `addProduct(product)`         | Agrega un producto a Firestore       |
| `updateProduct(id, updates)`  | Actualiza campos de un producto      |
| `deleteProduct(id)`           | Elimina un producto                  |
| `addCategory(cat)`            | Agrega una categoría                 |
| `updateCategory(id, updates)` | Actualiza una categoría              |
| `deleteCategory(id)`          | Elimina una categoría                |

---

### 5.4 Lógica Principal

**Archivo:** `js/script.js`

Módulo principal que maneja toda la interactividad de la página del cliente.

#### Configuración (`CONFIG`)

```javascript
const CONFIG = {
  ageKey: "modelorama_age_verified_v1", // Key localStorage verificación edad
  whatsappBase: "https://wa.me/5214531464786", // Número WhatsApp
  storeName: "Modelorama",
  favKey: "modelorama_favorites_v1" // Key localStorage favoritos
};
```

#### Subsistemas

**1. Verificación de Edad**

- Muestra modal al primer acceso
- Almacena verificación en `localStorage` (key: `modelorama_age_verified_v1`)
- Si el usuario no es mayor, redirige a Google

**2. Favoritos**

- Almacenados en `localStorage` (key: `modelorama_favorites_v1`)
- Toggle con icono de corazón en cada tarjeta
- Filtro de "Favoritos" en el catálogo

**3. Perfil de Usuario**

- Modal para guardar nombre, dirección y teléfono
- Almacenado en `localStorage` (key: `modelorama_profile`)
- Se incluye automáticamente en el mensaje de WhatsApp al pedir

**4. Carrito de Compras**

- Almacenado en `localStorage` (key: `modelorama_cart`)
- Funcionalidades: agregar, eliminar, actualizar cantidad, vaciar
- **Seguridad en UI:** Botones con `debounce` y desactivación temporal preventiva de múltiples clicks.
- Badges de conteo en navbar desktop y bottom nav móvil
- Offcanvas lateral con resumen y total
- Animación "fly to cart" cuando se agrega un producto
- Efecto de confetti al agregar productos
- **Cross-selling**: Al agregar cerveza, sugiere agregar botanas

**5. Pedido por WhatsApp**

- Genera mensaje formateado con:
  - Datos del perfil del cliente
  - Lista detallada del pedido
  - Total estimado
  - Enlace de ubicación GPS (si está disponible)
- Abre WhatsApp con el mensaje prellenado

**6. Renderizado de Productos**

- Grid responsivo (2 columnas móvil, 3 tablet, 4 desktop)
- Skeleton loading al cargar
- Filtros por categoría (Stories nav + dropdown)
- Búsqueda con autocompletado (máximo 6 sugerencias)
- Tarjetas con efecto 3D tilt al hacer hover
- Badges: OFERTA, PREMIUM, NUEVO, POPULAR, FRÍA
- Vista rápida (Quick View) en modal

**7. Navegación por Categorías**

- Estilo "Stories" (burbujas circulares con anillos de colores)
- Dropdown con autocompletado
- Sincronización bidireccional entre stories y dropdown
- Categorías especiales: "Todos" y "Favoritos"
- Dinámicas desde Firestore

**8. Scroll y Navbar**

- Efecto de compactación del navbar al hacer scroll
- Smooth scrolling entre secciones

---

### 5.5 Panel Admin

**Archivo:** `js/admin.js`

#### Autenticación

- Seguridad implementada a nivel de producción mediante **Firebase Authentication**.
- Login de administradores utilizando `signInWithEmailAndPassword`.
- Las sesiones son gestionadas internamente por la SDK de Firebase.

#### Gestión de Productos

- Tabla con búsqueda en tiempo real
- Modal de creación/edición con campos:
  - Nombre, marca, categoría, precio, descripción
  - Imagen (URL o subida a Firebase Storage)
  - Badge/etiqueta (OFERTA, PREMIUM, NUEVO, POPULAR, COMBO o personalizado)
  - Oferta con precio anterior
  - Icono y color de fallback
  - Toggle de "producto frío"
- Eliminación con confirmación

#### Gestión de Paquetes/Combos

- Grid de tarjetas con imagen, productos incluidos y ahorro
- Selector de productos a incluir con esquema de datos estricto `[{id, qty}]`
- Cálculo automático del ahorro vs. precio individual
- Mismo modal que productos pero con funcionalidad extra

#### Gestión de Categorías

- Tabla con preview del icono/anillo estilo Stories
- Modal de creación/edición:
  - ID, nombre, tipo (icono o imagen), orden
  - Selector de icono Bootstrap
  - Selector de color de anillo
- Eliminación con confirmación

#### Configuración

- **Nueva Cuenta de Admin**: Permite registrar a otro administrador directamente (crea usuario en Firebase Auth).
- **Cambiar contraseña**: Actualiza la contraseña activa en Firebase Auth de forma segura.
- **Aviso de Privacidad**: Textarea editable guardado en Firestore (`settings/legal`).
- **Términos y Condiciones**: Textarea editable guardado en Firestore (`settings/legal`).

#### Ciclo de Vida de Imágenes y Storage

- Subida directa a Firebase Storage con compresión visual.
- **Borrado Inteligente**: Al eliminar un producto/categoría que contiene una imagen, o al reemplazar la imagen existente con una nueva, el sistema purga proactivamente el archivo huérfano de `firebasestorage.googleapis.com` disminuyendo costos y manteniendo limpio el bucket.
- Las URLs se almacenan en el campo `image` respectivo.

---

### 5.6 Mapa de Entrega

**Archivo:** `js/map.js`

- **Motor:** Leaflet.js con tiles de CartoDB Voyager
- **Ubicación predeterminada:** Coalcomán, Michoacán (18.7767, -103.1614)
- **Marcador:** Icono dorado, arrastrable
- **Geolocalización:** Solicita permiso del navegador para ubicar al usuario automáticamente
- **Integración:** Se muestra en el offcanvas del carrito cuando hay productos
- **Envío:** La ubicación se incluye como link de Google Maps en el pedido por WhatsApp

---

### 5.7 Configuración Firebase

**Archivo:** `js/firebase-config.js`

```
Proyecto: modelorama-app-2026
Servicios habilitados:
  - Firestore (base de datos)
  - Storage (almacenamiento de archivos)
  - Persistencia offline habilitada (synchronizeTabs: true)
```

- Usa Firebase Compat SDK (v10.8.1)
- La persistencia offline permite que la app funcione sin conexión
- Los cambios offline se sincronizan automáticamente cuando vuelve la conexión

---

### 5.8 Sistema de Diseño

**Archivo:** `css/styles.css`

#### Paleta de Colores

| Variable           | Valor     | Uso                         |
| ------------------ | --------- | --------------------------- |
| `--bg-base`        | `#F8F9FA` | Fondo general               |
| `--bg-surface`     | `#FFFFFF` | Fondo de tarjetas           |
| `--accent-gold`    | `#ffc92c` | Amarillo oficial Modelorama |
| `--primary-blue`   | `#092440` | Azul oscuro principal       |
| `--secondary-blue` | `#10356e` | Azul secundario             |
| `--alert-red`      | `#EF4444` | Alertas/errores             |
| `--success-green`  | `#10B981` | Éxito                       |
| `--whatsapp-green` | `#25D366` | Botones de WhatsApp         |

#### Tipografías

- **Montserrat** (800, 900): Títulos y encabezados
- **Outfit** (300, 400, 600): Cuerpo de texto y navegación
- **Inter** (Panel admin): Interfaz administrativa

#### Componentes UI Principales

- **Glassmorphism**: Paneles semitransparentes con blur
- **Stories Navigation**: Navegación por categorías estilo Instagram Stories
- **Product Cards**: Tarjetas con efecto 3D tilt y glow
- **Mobile Bottom Nav**: Navegación inferior con FAB central
- **Skeleton Loading**: Placeholders animados de carga

---

### 5.9 Service Worker / PWA

**Archivo:** `sw.js`

**Estrategia:** Network-first con fallback a cache

- **Instalación:** Pre-cachea archivos estáticos (HTML, CSS, JS) y librería externas
- **Activación:** Elimina caches obsoletos
- **Fetch:** Intenta red primero; si falla, sirve desde cache

**Manifest (`manifest.json`):**

- Nombre: "Modelorama Premium"
- Display: standalone (se ve como app nativa)
- Theme color: `#ffc92c`
- Iconos: 192x192 y 512x512

---

## 6. Base de Datos

### Colecciones de Firestore

```
📁 Firestore Database
│
├── 📂 products/                    ← Cada documento es un producto
│   ├── 📄 corona-extra-media
│   ├── 📄 modelo-especial-lata
│   ├── 📄 pkg-paquete-fiesta-...   ← Los paquetes también van aquí
│   └── ...
│
├── 📂 categories/                  ← Cada documento es una categoría
│   ├── 📄 corona
│   ├── 📄 modelo
│   ├── 📄 licores
│   └── ...
│
└── 📂 settings/                    ← Configuraciones del sistema
    ├── 📄 admin                    ← { password: "1234" }
    ├── 📄 init                     ← { productsSeeded: true, categoriesSeeded: true }
    └── 📄 legal                    ← { privacy: "...", terms: "..." }
```

### Reglas de Seguridad (Actuales)

**Firestore (`firestore.rules`):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lectura pública del catálogo comercial
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /categories/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Privacidad comercial y general
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage (`storage.rules`):**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 7. Flujos de Usuario

### 7.1 Flujo del Cliente

```
1. Accede a index.html
2. ¿Es mayor de edad? → Sí: Continúa / No: Redirige a Google
3. Navega el catálogo (filtra por categoría o busca)
4. Agrega productos al carrito (efecto de confetti + cross-sell)
5. Abre el carrito → Ve resumen y total
6. (Opcional) Arrastra marcador en mapa para indicar ubicación
7. "Completar Pedido" → Abre WhatsApp con mensaje prellenado
8. Confirma pedido en WhatsApp con el negocio
```

### 7.2 Flujo del Administrador

```
1. Accede a admin.html
2. Ingresa contraseña (por defecto: 1234)
3. Ve dashboard con estadísticas
4. Gestiona productos:
   - Crear nuevo producto/paquete
   - Editar precios, descripciones, imágenes
   - Subir imágenes a Firebase Storage
   - Eliminar productos
5. Gestiona categorías:
   - Crear, editar, reordenar, eliminar
6. Configuración:
   - Cambiar contraseña
   - Editar textos legales
7. Los cambios se reflejan en tiempo real en index.html
```

---

## 8. Funcionalidades Detalladas

### Almacenamiento Local (localStorage)

| Key                          | Datos                    | Descripción                     |
| ---------------------------- | ------------------------ | ------------------------------- |
| `modelorama_age_verified_v1` | `'true'`                 | Verificación de edad completada |
| `modelorama_favorites_v1`    | `['id1', 'id2']`         | IDs de productos favoritos      |
| `modelorama_cart`            | `[{product...}]`         | Carrito de compras actual       |
| `modelorama_profile`         | `{name, address, phone}` | Datos del cliente               |

### Almacenamiento de Sesión

*Firebase Auth SDK administra internamente el local storage de las sesiones indexadas de forma segura y encriptada por defecto.*

### Eventos Globales

| Evento                      | Disparado por                      | Escuchado por               |
| --------------------------- | ---------------------------------- | --------------------------- |
| `productsUpdated`           | `products.js` (Firestore listener) | `script.js`, `admin.js`     |
| `categoriesUpdated`         | `products.js` (Firestore listener) | `script.js`, `admin.js`     |
| `categorySelectedFromStory` | `script.js` (click en story)       | `script.js` (dropdown sync) |

### Funciones Globales (window)

| Función                       | Módulo      | Descripción                        |
| ----------------------------- | ----------- | ---------------------------------- |
| `confirmAge(bool)`            | script.js   | Verificar/rechazar edad            |
| `toggleFavorite(id)`          | script.js   | Agregar/quitar favorito            |
| `addProductToCart(id, event)` | script.js   | Agregar producto al carrito        |
| `removeFromCart(id)`          | script.js   | Eliminar del carrito               |
| `updateQuantity(id, delta)`   | script.js   | Modificar cantidad                 |
| `clearCart()`                 | script.js   | Vaciar carrito                     |
| `openCartModal()`             | script.js   | Abrir offcanvas del carrito        |
| `sendCartToWhatsApp()`        | script.js   | Enviar pedido por WhatsApp         |
| `openQuickView(id)`           | script.js   | Abrir vista rápida del producto    |
| `addToCartFromQV()`           | script.js   | Agregar desde Quick View           |
| `buyNowFromQV()`              | script.js   | Comprar ahora desde Quick View     |
| `openProfileModal()`          | script.js   | Abrir modal de perfil              |
| `saveProfile()`               | script.js   | Guardar perfil del cliente         |
| `orderPromo(name, price)`     | script.js   | Ordenar una promoción por WhatsApp |
| `attemptLogin()`              | admin.js    | Intentar login Auth en admin       |
| `createNewAdmin()`            | admin.js    | Registrar nuevo admin en Firebase  |
| `changePassword()`            | admin.js    | Cambiar contraseña del admin       |
| `saveLegalContent(type)`      | admin.js    | Guardar texto legal                |
| `saveProduct()`               | admin.js    | Guardar/crear producto             |
| `handleDeleteProduct()`       | admin.js    | Eliminar producto                  |
| `saveCategory()`              | admin.js    | Guardar/crear categoría            |
| `handleDeleteCategory()`      | admin.js    | Eliminar categoría                 |
| `getProducts()`               | products.js | Obtener lista de productos         |
| `addProduct(product)`         | products.js | Agregar producto a Firestore       |
| `updateProduct(id, data)`     | products.js | Actualizar producto                |
| `deleteProduct(id)`           | products.js | Eliminar producto (+ storage)      |
| `deleteImageFromStorage(url)` | products.js | Borrar imagen física               |

---

## 9. Configuración y Despliegue

### Requisitos Previos

- Cuenta de Firebase con proyecto `modelorama-app-2026`
- Firebase CLI instalado (`npm install -g firebase-tools`)
- Node.js (para Firebase CLI)

### Despliegue en Firebase Hosting

```bash
# 1. Login en Firebase
firebase login

# 2. Inicializar (si es primera vez)
firebase init

# 3. Desplegar
firebase deploy
```

### Configuración de Hosting (`firebase.json`)

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "firebase-config.json",
      "firebase-config-clean.json"
    ]
  }
}
```

### Variables de Entorno / Configuración

Toda la configuración de Firebase está en `js/firebase-config.js`. No se usan variables de entorno (es una app 100% frontend).

---

## 10. Seguridad

### Estado Actual de Nivel Producción

| Aspecto              | Estado          | Notas                                                                                                           |
| -------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| Verificación de edad | ✅ Implementada | Almacenada en localStorage (bypasseable por razones UX)                                                         |
| Autenticación admin  | ✅ Firebase Auth| Uso estricto de JWT manejado por la API de Auth de Google                                                       |
| Reglas Firestore     | ✅ Restringidas | Bloquea todas las lecturas de sistema y prevé mutaciones sobre el catálogo sólo para administradores.           |
| Reglas Storage       | ✅ Restringidas | Lectura pública pero escritura 100% blindada                                                                    |
| HTTPS                | ✅              | Firebase Hosting provee SSL automático                                                                          |
| API Keys             | ✅ Seguras      | Las llaves públicas no tienen poder directos sin los tokens JWT otorgados por validación real humana.         |

---

## 11. API y Funciones Globales

### Integración WhatsApp

No se usa una API oficial, sino el esquema de URL de WhatsApp:

```
https://wa.me/5214531464786?text={mensaje_codificado}
```

El mensaje se genera dinámicamente con los datos del carrito y perfil del cliente.

### Integración con Mapas

- **Proveedor:** OpenStreetMap vía CartoDB Voyager tiles
- **Librería:** Leaflet.js v1.9.4
- **Geolocalización:** API nativa del navegador (`navigator.geolocation`)
- **Envío de ubicación:** Se genera un enlace de Google Maps con las coordenadas

---

## Diagrama de Relaciones entre Módulos

```
firebase-config.js
       │
       ▼
   products.js ──────────────────────────────┐
       │                                      │
       ├── getProducts()                      │
       ├── addProduct()                       │
       ├── updateProduct()                    │
       ├── deleteProduct()                    │
       ├── addCategory()                      │
       ├── updateCategory()                   │
       ├── deleteCategory()                   │
       │                                      │
       ├──── Eventos: productsUpdated    ─────┤
       ├──── Eventos: categoriesUpdated  ─────┤
       │                                      │
       ▼                                      ▼
   script.js                            admin.js
   (Página cliente)                  (Panel admin)
       │                                      │
       ├── Carrito                             ├── CRUD Productos
       ├── Favoritos                           ├── CRUD Categorías
       ├── Verificación edad                   ├── CRUD Paquetes
       ├── Renderizado productos               ├── Subida imágenes
       ├── Búsqueda + filtros                  ├── Autenticación
       ├── WhatsApp integration                ├── Configuración legal
       └── Perfil usuario                      └── Dashboard stats
       │
       ▼
    map.js
    (Mapa Leaflet)
```

---

> **Contacto del negocio:** WhatsApp [453-146-4786](https://wa.me/5214531464786)  
> **Ubicación:** Coalcomán, Michoacán, México  
> **Horario:** Lunes a Domingo, 10:00 AM – 10:00 PM
