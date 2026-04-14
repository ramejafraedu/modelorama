// variables globales para mapa
window.deliveryMap = null;
window.deliveryMarker = null;
window.userLocation = null;

function initMap() {
    // Si ya está inicializado, solo forzamos resize
    if (window.deliveryMap) {
        setTimeout(() => {
            window.deliveryMap.invalidateSize();
        }, 300);
        return;
    }

    const mapContainer = document.getElementById('deliveryMap');
    if (!mapContainer) return;

    // Default: Coalcomán, Michoacán
    const defaultLat = 18.7767;
    const defaultLng = -103.1614;

    window.deliveryMap = L.map('deliveryMap').setView([defaultLat, defaultLng], 15);

    // Light map tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(window.deliveryMap);

    // Icono Premium Oro
    const goldIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    window.deliveryMarker = L.marker([defaultLat, defaultLng], {
        icon: goldIcon,
        draggable: true
    }).addTo(window.deliveryMap);

    // Guardar ubicación inicial
    window.userLocation = { lat: defaultLat, lng: defaultLng };

    window.deliveryMarker.on('dragend', function (e) {
        window.userLocation = window.deliveryMarker.getLatLng();
    });

    // Intentar obtener ubicación real del usuario
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                window.userLocation = { lat, lng };

                window.deliveryMap.setView([lat, lng], 16);
                window.deliveryMarker.setLatLng([lat, lng]);
            },
            (error) => {
                console.warn("Geolocalización no disponible o denegada", error);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }
}

// Escuchar el evento del carrito para inicializar/mostrar el mapa
document.addEventListener('DOMContentLoaded', () => {
    const cartOffcanvasEl = document.getElementById('cartOffcanvas');
    if (cartOffcanvasEl) {
        cartOffcanvasEl.addEventListener('shown.bs.offcanvas', () => {
            const mapSection = document.getElementById('mapSection');
            // Solo mostrar mapa si hay items en el carrito
            const cart = JSON.parse(localStorage.getItem('modelorama_cart') || '[]');
            if (cart.length > 0) {
                mapSection.style.display = 'block';
                initMap();
            } else {
                mapSection.style.display = 'none';
            }
        });
    }
});
