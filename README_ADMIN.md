# Panel de Administración - Modelorama Coalcomán

> **Versión**: 2.0  
> **Autor**: Desarrollado completamente por el estudiante  
> **Stack**: HTML5, CSS3, JavaScript ES6+, Bootstrap 5, Firebase (Firestore + Storage)

## Acceso al Panel

1. Navegar a `admin.html` en el sitio desplegado
2. Credenciales de acceso:
   - **Usuario**: `ramejafraUser`
   - **Contraseña**: `admin123`

## Características Principales

### Gestión de Productos
- **CRUD Completo**: Crear, leer, actualizar y eliminar productos
- **Edición en Tiempo Real**: Cambios sincronizados instantáneamente con Firebase
- **Gestión de Categorías**: Organización jerárquica de productos
- **Imágenes**: Subida directa a Firebase Storage

### Dashboard Analítico
- Estadísticas de ventas (simuladas)
- Conteo de productos por categoría
- Alertas de stock bajo
- Vista general del negocio

### Sistema de Promociones
- Creación de paquetes y combos
- Descuentos por volumen
- Promociones temporales

## Arquitectura Técnica

### Cambio Arquitectónico: JSON → Firebase
> **Decisión técnica**: Se migró de almacenamiento local JSON a Firebase Firestore para habilitar:
> - Sincronización en tiempo real entre admin y sitio principal
> - Persistencia cloud de datos e imágenes
> - Escalabilidad para múltiples sucursales futuras

### Estructura de Datos Firebase

```
Firestore
├── products/          # Catálogo de productos
├── categories/        # Categorías organizadas
├── settings/          # Configuración del negocio
└── promotions/        # Promociones activas

Storage
├── products/          # Imágenes de productos
└── categories/        # Iconos de categorías
```

### Módulos JavaScript (ES6)

El proyecto implementa **separación de responsabilidades** mediante módulos ES6:

```
js/modules/
├── firebase-client.js     # Configuración Firebase
├── product-service.js     # Operaciones CRUD
├── cart-manager.js        # Lógica del carrito
└── ui-utils.js            # Helpers de UI
```

**Autenticación**: Se implementó autenticación simulada usando `users.json` (local) mientras se evalúa Firebase Auth para producción.

### PWA (Progressive Web App)

El panel admin es parte de la PWA completa:
- **Service Worker**: Estrategias Cache-First, Network-First, Stale-While-Revalidate
- **Manifest**: Configuración para instalación en dispositivos
- **Offline**: Persistencia local con sincronización automática

## Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `admin.html` | Interfaz de usuario del panel |
| `js/admin.js` | Lógica principal del admin (60KB+) |
| `js/modules/` | Módulos ES6 reutilizables |
| `css/styles.css` | Estilos compartidos con sitio principal |

## Decisiones de Diseño

### UI/UX
- **Tema Claro/Oscuro**: Implementado mediante CSS variables con transiciones suaves
- **Diseño Minimalista**: Inspirado en interfaces modernas de gestión (Notion, Linear)
- **Mobile-First**: Panel completamente responsive para gestión desde móvil

### Seguridad
- Credenciales de Firebase **no commiteadas** al repositorio
- Reglas de Firestore configuradas para acceso controlado
- Validación de edad (18+) en sitio principal

## Despliegue

### Requisitos Previos
1. Crear proyecto en Firebase Console
2. Habilitar Firestore Database y Storage
3. Configurar reglas de seguridad
4. Copiar `firebase-config.example.json` a `firebase-config.json` con credenciales reales

### Comandos de Despliegue
```bash
# Firebase Hosting (recomendado)
firebase deploy

# O servidor local para desarrollo
npx serve .
```

## Notas para Evaluación

> Este proyecto fue desarrollado **completamente por el estudiante** como parte de su formación técnica en creación de contenido digital y desarrollo web.

**Aspectos Destacados**:
- ✅ Arquitectura cliente-servidor completa (Frontend + Backend-as-a-Service)
- ✅ Sincronización en tiempo real con Firebase
- ✅ PWA con estrategias avanzadas de caché
- ✅ Sistema de temas claro/oscuro
- ✅ Modularización ES6 con separación de responsabilidades
- ✅ UX/UI profesional y responsive

**Video Documental**: Se recomienda grabar un video corto mostrando:
1. Edición de productos en tiempo real
2. Visualización sincronizada en sitio principal
3. Cambio entre temas claro/oscuro
4. Funcionamiento offline (PWA)
