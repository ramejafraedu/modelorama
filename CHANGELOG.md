# Changelog - Modelorama Coalcomán

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-14

### Security
- **CRÍTICO**: Remover credenciales Firebase del repositorio público
- Agregar `.gitignore` para archivos sensibles (`firebase-config.json`, `users.json`, `.firebase/`)
- Crear `firebase-config.example.json` como template sin credenciales reales

### Added
- **PWA Service Worker Avanzado**: Implementación de estrategias de caché diferenciadas
  - Cache-First para recursos estáticos locales (CSS, JS, HTML, imágenes)
  - Network-First para datos de Firebase/Firestore
  - Stale-While-Revalidate para recursos CDN (Bootstrap, SweetAlert2, Leaflet)
- **Sistema de Temas**: Implementación completa de tema claro/oscuro
  - CSS variables para todos los colores del tema
  - Transiciones suaves de 0.3s entre temas
  - Botón de toggle en navbar con iconos dinámicos (sol/luna)
  - Persistencia de preferencia en localStorage
  - Detección automática de preferencia del sistema operativo
- **Arquitectura Modular ES6**: Separación de responsabilidades
  - `modules/firebase-client.js`: Configuración y conexión Firebase
  - `modules/product-service.js`: Operaciones CRUD de productos
  - `modules/cart-manager.js`: Gestión del carrito de compras
  - `modules/ui-utils.js`: Helpers y utilidades de UI
- **Documentación Profesional**
  - README_ADMIN.md completamente reescrito con arquitectura técnica
  - CHANGELOG.md con historial de versiones
  - Documentación de módulos ES6 en `js/modules/README.md`

### Changed
- **Refactorización CSS**: Migración completa a CSS variables
  - `:root` para tema claro (default)
  - `[data-theme="dark"]` para tema oscuro
  - Transiciones automáticas en todos los elementos

### Technical Debt
- Preparación para migración completa a ES6 modules (coexistencia con código global actual)

## [1.0.0] - 2026-03-XX

### Added
- **Versión Inicial del Proyecto**
  - Landing page con catálogo de productos
  - Panel de administración básico
  - Integración con Firebase Firestore
  - Carrito de compras con WhatsApp
  - Mapa de entrega con Leaflet
  - Verificación de edad (18+)
  - Diseño responsive con Bootstrap 5
  - PWA básico con manifest.json y service worker simple

### Features
- Catálogo de productos dinámico desde Firebase
- Sistema de búsqueda y filtrado
- Gestión de promociones y paquetes
- Perfil de usuario local (localStorage)
- Notificaciones con SweetAlert2

---

## Notas de Desarrollo

### Migración a ES6 Modules
La versión 2.0 establece la base para una migración completa a ES6 modules. Los módulos creados pueden coexistir con el código global actual, permitiendo una migración gradual sin romper funcionalidad existente.

### Decisiones Arquitectónicas

**Firebase vs JSON Local**
- Decisión: Migrar de JSON local a Firebase Firestore
- Razón: Sincronización en tiempo real entre admin y sitio principal
- Impacto: Escalabilidad para múltiples sucursales futuras

**Service Worker Strategies**
- Decisión: Implementar 3 estrategias diferenciadas
- Razón: Optimizar velocidad (caché estáticos) y frescura de datos (red para APIs)
- Impacto: Mejor UX en condiciones de conectividad variable

**CSS Variables para Temas**
- Decisión: Usar CSS variables nativas en lugar de clases CSS
- Razón: Transiciones suaves y código más mantenible
- Impacto: Performance superior vs cambio de clases

---

## Roadmap Futuro

### [2.1.0] - Planeado
- [ ] Migración completa de `script.js` a ES6 modules
- [ ] Migración completa de `admin.js` a ES6 modules
- [ ] Implementar Firebase Authentication real
- [ ] Tests unitarios para módulos

### [2.2.0] - Planeado  
- [ ] Sistema de pedidos con historial
- [ ] Notificaciones push
- [ ] Analytics con Firebase Analytics
- [ ] Optimización de imágenes (WebP, lazy loading)

### [3.0.0] - Planeado
- [ ] Backend propio (Node.js/Firebase Functions)
- [ ] Pasarela de pagos (Stripe/MercadoPago)
- [ ] App móvil nativa (Capacitor/React Native)
- [ ] Multi-sucursal con geolocalización
