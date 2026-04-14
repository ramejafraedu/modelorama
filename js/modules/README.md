# Módulos ES6 - Arquitectura JavaScript

Este directorio contiene los módulos ES6 que implementan la separación de responsabilidades en la aplicación Modelorama.

## 📁 Estructura de Módulos

```
js/modules/
├── firebase-client.js     # Configuración y conexión a Firebase
├── product-service.js     # Operaciones CRUD de productos
├── cart-manager.js        # Lógica del carrito de compras
├── ui-utils.js            # Utilidades de UI y helpers
└── README.md              # Este archivo
```

## 🔌 Uso de Módulos

### Importación Named (Recomendado)

```javascript
import { getFirestore, COLLECTIONS } from './modules/firebase-client.js';
import { subscribeToProducts, createProduct } from './modules/product-service.js';
import { addToCart, getCart, calculateTotal } from './modules/cart-manager.js';
import { formatPrice, showToast } from './modules/ui-utils.js';
```

### Importación por Defecto

```javascript
import FirebaseClient from './modules/firebase-client.js';
const db = FirebaseClient.getFirestore();
```

## 📦 Descripción de Módulos

### `firebase-client.js`
**Responsabilidad**: Gestión de la conexión a Firebase

- `initializeFirebase()` - Inicializa la app de Firebase
- `getFirestore()` - Obtiene instancia de Firestore (singleton)
- `getStorage()` - Obtiene instancia de Storage
- `COLLECTIONS` - Constantes de nombres de colecciones

### `product-service.js`
**Responsabilidad**: Operaciones con productos y categorías

- `subscribeToProducts(callback)` - Suscripción en tiempo real a productos
- `subscribeToCategories(callback)` - Suscripción en tiempo real a categorías
- `createProduct(data)` - Crear nuevo producto
- `updateProduct(id, updates)` - Actualizar producto existente
- `deleteProduct(id)` - Eliminar producto
- `getProductById(id)` - Obtener producto específico
- `searchProducts(query)` - Búsqueda de productos

### `cart-manager.js`
**Responsabilidad**: Gestión del carrito de compras

- `getCart()` - Obtener items del carrito
- `addToCart(product, quantity)` - Agregar producto
- `updateQuantity(id, quantity)` - Actualizar cantidad
- `removeFromCart(id)` - Eliminar producto del carrito
- `clearCart()` - Vaciar carrito
- `calculateTotal()` - Calcular total
- `generateWhatsAppMessage(info)` - Generar mensaje para WhatsApp

### `ui-utils.js`
**Responsabilidad**: Helpers de interfaz de usuario

- `formatPrice(price)` - Formato de moneda MXN
- `formatDate(date)` - Formato de fecha local
- `createElement(tag, attrs, content)` - Crear elementos DOM
- `showToast(message, type)` - Mostrar notificación
- `debounce(func, wait)` - Función debounce
- `throttle(func, limit)` - Función throttle
- `generateId()` - Generar ID único

## 🚀 Migración desde Código Global

### Antes (Global)
```javascript
// En products.js
window.appProducts = [];
function initData() {
    db.collection('products').onSnapshot(...);
}
```

### Después (Modular)
```javascript
// Usando módulos
import { subscribeToProducts } from './modules/product-service.js';

subscribeToProducts((products) => {
    // Renderizar productos
});
```

## 🔄 Compatibilidad con Código Existente

Los módulos pueden coexistir con el código global actual. Para usar módulos:

1. En el HTML, cambiar el script a `type="module"`:
```html
<script type="module" src="js/main.js"></script>
```

2. O usar import dinámico:
```javascript
const { addToCart } = await import('./modules/cart-manager.js');
```

## 📝 Notas de Implementación

- Los módulos usan ES6 import/export nativo
- Firebase se mantiene como global (compatibilidad con CDN)
- Los módulos son tree-shakeable
- No hay dependencias externas (solo Firebase global)
