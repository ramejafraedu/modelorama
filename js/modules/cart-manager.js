/**
 * Cart Manager Module
 * Gestión del carrito de compras con persistencia local
 * 
 * @module cart-manager
 */

const STORAGE_KEY = 'modelorama_cart';

// Evento personalizado para cambios en el carrito
const dispatchCartEvent = (cart) => {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
};

/**
 * Obtiene el carrito actual desde localStorage
 * @returns {Array} Items del carrito
 */
export function getCart() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('[CartManager] Error reading cart:', e);
        return [];
    }
}

/**
 * Guarda el carrito en localStorage
 * @param {Array} cart - Items del carrito
 */
export function saveCart(cart) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        dispatchCartEvent(cart);
    } catch (e) {
        console.error('[CartManager] Error saving cart:', e);
    }
}

/**
 * Agrega un producto al carrito
 * @param {Object} product - Producto a agregar
 * @param {number} quantity - Cantidad
 * @returns {Array} Carrito actualizado
 */
export function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) {
        // Actualizar cantidad si existe
        cart[existingIndex].quantity += quantity;
    } else {
        // Agregar nuevo item
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    return cart;
}

/**
 * Actualiza cantidad de un producto
 * @param {string} productId - ID del producto
 * @param {number} quantity - Nueva cantidad
 * @returns {Array} Carrito actualizado
 */
export function updateQuantity(productId, quantity) {
    const cart = getCart();
    
    if (quantity <= 0) {
        return removeFromCart(productId);
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
    }
    
    return cart;
}

/**
 * Elimina un producto del carrito
 * @param {string} productId - ID del producto
 * @returns {Array} Carrito actualizado
 */
export function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id !== productId);
    saveCart(cart);
    return cart;
}

/**
 * Vacía el carrito completamente
 */
export function clearCart() {
    localStorage.removeItem(STORAGE_KEY);
    dispatchCartEvent([]);
}

/**
 * Calcula el total del carrito
 * @returns {number} Total calculado
 */
export function calculateTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Cuenta el número total de items
 * @returns {number} Cantidad total
 */
export function getItemCount() {
    return getCart().reduce((count, item) => count + item.quantity, 0);
}

/**
 * Genera mensaje de WhatsApp con el pedido
 * @param {Object} customerInfo - Información del cliente
 * @returns {string} Mensaje formateado
 */
export function generateWhatsAppMessage(customerInfo = {}) {
    const cart = getCart();
    
    if (cart.length === 0) {
        return 'Hola, me gustaría hacer un pedido.';
    }
    
    let message = '📦 *Nuevo Pedido - Modelorama*\n\n';
    message += '*Productos:*\n';
    
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   Cant: ${item.quantity} x $${item.price.toFixed(2)} = $${subtotal.toFixed(2)}\n\n`;
    });
    
    const total = calculateTotal();
    message += `*Total: $${total.toFixed(2)}*\n\n`;
    
    if (customerInfo.name) {
        message += `*Cliente:* ${customerInfo.name}\n`;
    }
    if (customerInfo.address) {
        message += `*Dirección:* ${customerInfo.address}\n`;
    }
    if (customerInfo.phone) {
        message += `*Teléfono:* ${customerInfo.phone}\n`;
    }
    
    message += '\nGracias por su atención.';
    
    return encodeURIComponent(message);
}

export default {
    getCart,
    saveCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    calculateTotal,
    getItemCount,
    generateWhatsAppMessage
};
