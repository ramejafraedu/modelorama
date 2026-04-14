/**
 * Firebase Client Module
 * Módulo ES6 para configuración y operaciones base de Firebase
 * 
 * @module firebase-client
 */

// Configuración se carga desde archivo separado (no versionado)
const getFirebaseConfig = () => {
    // Intentar cargar desde variable global (compatibility mode)
    if (typeof firebaseConfig !== 'undefined') {
        return firebaseConfig;
    }
    
    // Si no existe, mostrar error
    console.error('[FirebaseClient] firebaseConfig no encontrada. Asegúrate de cargar firebase-config.js primero.');
    return null;
};

/**
 * Inicializa Firebase con la configuración proporcionada
 * @returns {Object} Instancia de Firestore
 */
export function initializeFirebase() {
    const config = getFirebaseConfig();
    
    if (!config) {
        throw new Error('Firebase config no disponible');
    }
    
    // Inicializar si no está ya inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }
    
    const db = firebase.firestore();
    
    // Habilitar persistencia offline
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('[Firebase] Múltiples pestañas abiertas');
            } else if (err.code === 'unimplemented') {
                console.warn('[Firebase] Persistencia no soportada');
            }
        });
    
    return db;
}

/**
 * Obtiene instancia de Firestore (singleton)
 * @returns {Object} Instancia de Firestore
 */
export function getFirestore() {
    if (!window._firebaseDb) {
        window._firebaseDb = initializeFirebase();
    }
    return window._firebaseDb;
}

/**
 * Obtiene instancia de Firebase Storage
 * @returns {Object} Instancia de Storage
 */
export function getStorage() {
    return firebase.storage();
}

/**
 * Colecciones disponibles en Firestore
 */
export const COLLECTIONS = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    SETTINGS: 'settings',
    ORDERS: 'orders',
    PROMOTIONS: 'promotions'
};

export default {
    initializeFirebase,
    getFirestore,
    getStorage,
    COLLECTIONS
};
