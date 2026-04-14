/**
 * Product Service Module
 * Operaciones CRUD para productos usando Firebase Firestore
 * 
 * @module product-service
 */

import { getFirestore, COLLECTIONS } from './firebase-client.js';

const db = getFirestore();

/**
 * Obtiene todos los productos en tiempo real
 * @param {Function} callback - Función a ejecutar con los datos
 * @returns {Function} Función para unsubscribe
 */
export function subscribeToProducts(callback) {
    return db.collection(COLLECTIONS.PRODUCTS)
        .onSnapshot(
            (snapshot) => {
                const products = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(products);
            },
            (error) => {
                console.error('[ProductService] Error fetching products:', error);
                callback([]);
            }
        );
}

/**
 * Obtiene todas las categorías en tiempo real
 * @param {Function} callback - Función a ejecutar con los datos
 * @returns {Function} Función para unsubscribe
 */
export function subscribeToCategories(callback) {
    return db.collection(COLLECTIONS.CATEGORIES)
        .onSnapshot(
            (snapshot) => {
                const categories = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(categories);
            },
            (error) => {
                console.error('[ProductService] Error fetching categories:', error);
                callback([]);
            }
        );
}

/**
 * Crea un nuevo producto
 * @param {Object} productData - Datos del producto
 * @returns {Promise<string>} ID del producto creado
 */
export async function createProduct(productData) {
    const docRef = await db.collection(COLLECTIONS.PRODUCTS).add({
        ...productData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
}

/**
 * Actualiza un producto existente
 * @param {string} productId - ID del producto
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<void>}
 */
export async function updateProduct(productId, updates) {
    await db.collection(COLLECTIONS.PRODUCTS).doc(productId).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

/**
 * Elimina un producto
 * @param {string} productId - ID del producto
 * @returns {Promise<void>}
 */
export async function deleteProduct(productId) {
    await db.collection(COLLECTIONS.PRODUCTS).doc(productId).delete();
}

/**
 * Obtiene un producto por ID
 * @param {string} productId - ID del producto
 * @returns {Promise<Object|null>} Datos del producto
 */
export async function getProductById(productId) {
    const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

/**
 * Busca productos por nombre (búsqueda simple)
 * @param {string} query - Texto a buscar
 * @returns {Promise<Array>} Productos encontrados
 */
export async function searchProducts(query) {
    const snapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (!query) return products;
    
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
    );
}

export default {
    subscribeToProducts,
    subscribeToCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    searchProducts
};
