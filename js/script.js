document.addEventListener('DOMContentLoaded', () => {

    // ===== CONFIGURATION =====
    const CONFIG = {
        ageKey: 'modelorama_age_verified_v1',
        whatsappBase: 'https://wa.me/5214531464786', // Default fallback
        storeName: 'Modelorama',
        favKey: 'modelorama_favorites_v1',
        themeKey: 'modelorama_theme_v1'
    };

    // Fetch dynamic store configuration
    if (typeof db !== 'undefined') {
        db.collection('settings').doc('store').get().then(doc => {
            if (doc.exists && doc.data().whatsapp) {
                const number = doc.data().whatsapp;
                CONFIG.whatsappBase = `https://wa.me/${number}`;

                // Update specific DOM links
                document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
                    try {
                        const url = new URL(link.href);
                        link.href = `https://wa.me/${number}${url.search}`;

                        // Update visual text if it's the top bar WhatsApp link
                        if (link.innerHTML.includes('453-146-4786')) {
                            const last10 = number.length >= 10 ? number.slice(-10) : number;
                            const formatted = `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}`;
                            link.innerHTML = link.innerHTML.replace('453-146-4786', formatted);
                        }
                    } catch (e) { }
                });
            }
        }).catch(err => console.error('Error fetching store info:', err));
    }

    // ===== THEME MANAGEMENT =====
    const initTheme = () => {
        document.documentElement.removeAttribute('data-theme');
    };

    window.toggleTheme = () => {
        // Dark mode is effectively disabled.
    };

    // ===== FAVORITES MANAGEMENT =====
    let favorites = JSON.parse(localStorage.getItem(CONFIG.favKey) || '[]');

    window.toggleFavorite = (id) => {
        const index = favorites.indexOf(id);
        if (index === -1) {
            favorites.push(id);
            showToast('Agregado a favoritos');
        } else {
            favorites.splice(index, 1);
            showToast('Eliminado de favoritos', 'info');
        }
        localStorage.setItem(CONFIG.favKey, JSON.stringify(favorites));

        // Re-render to update icons
        const activeTab = document.querySelector('.category-btn.active');
        const category = activeTab ? activeTab.dataset.category : 'all';
        renderProducts(category);
    };

    const isFavorite = (id) => favorites.includes(id);

    // ===== LOYALTY POINTS LOGIC REMOVED =====

    // ===== USER PROFILE =====
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));

    window.openProfileModal = () => {
        const profile = JSON.parse(localStorage.getItem('modelorama_profile') || '{}');
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileAddress').value = profile.address || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        profileModal.show();
    };

    window.saveProfile = () => {
        const name = document.getElementById('profileName').value;
        const address = document.getElementById('profileAddress').value;
        const phone = document.getElementById('profilePhone').value;

        if (!name) {
            showToast('Por favor ingresa al menos tu nombre', 'warning');
            return;
        }

        const profile = { name, address, phone };
        localStorage.setItem('modelorama_profile', JSON.stringify(profile));

        profileModal.hide();
        showToast('Perfil guardado correctamente');
    };

    // ===== CARRITO DE COMPRAS =====
    let cart = JSON.parse(localStorage.getItem('modelorama_cart') || '[]');

    const updateCartCount = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        // Desktop Badge
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // Mobile Badge
        const mobileCartCount = document.getElementById('mobileCartCount');
        if (mobileCartCount) {
            mobileCartCount.textContent = totalItems;
            mobileCartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }


    };

    const triggerConfetti = () => {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffc92c', '#092440', '#ffffff']
            });
        }
    };

    const checkCrossSell = (product) => {
        const rules = window.crossSellRules || [];
        if (rules.length === 0) return;

        const products = getProducts();

        for (const rule of rules) {
            if (product.category === rule.triggerCategory) {
                // Check if suggested product is already in cart
                const alreadyInCart = cart.some(i => i.id === rule.suggestProductId);
                if (alreadyInCart) continue;

                const suggested = products.find(p => p.id === rule.suggestProductId);
                if (!suggested) continue;

                const imgUrl = suggested.image || '';
                const message = rule.customMessage || `¡Complementa tu compra con ${suggested.name}!`;

                Swal.fire({
                    title: '¿Se te antoja algo más?',
                    text: message,
                    imageUrl: imgUrl || undefined,
                    imageWidth: imgUrl ? 200 : undefined,
                    imageHeight: imgUrl ? 200 : undefined,
                    showCancelButton: true,
                    confirmButtonColor: '#ffc92c',
                    cancelButtonColor: '#092440',
                    confirmButtonText: `Sí, agregar ${suggested.name} ($${suggested.price.toFixed(2)})`,
                    cancelButtonText: 'No, gracias',
                    color: '#092440',
                    background: '#fff'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.addProductToCart(suggested.id);
                    }
                });
                break; // Only show one cross-sell popup at a time
            }
        }
    };

    const addToCart = (product, sourceElement = null) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
            // Only trigger cross-sell on new items to avoid annoyance
            setTimeout(() => checkCrossSell(product), 1000);
        }
        localStorage.setItem('modelorama_cart', JSON.stringify(cart));
        updateCartCount();

        if (sourceElement) {
            flyToCart(sourceElement);
        } else {
            showToast(`${product.name} agregado al carrito`);
        }

        // Trigger micro-confetti for satisfaction
        triggerConfetti();
    };

    // Animation: Fly to Cart
    const flyToCart = (sourceElement) => {
        if (!sourceElement) return;

        const cartBtn = document.querySelector('.bi-cart3').parentElement;
        if (!cartBtn) return;

        const imgClone = sourceElement.cloneNode(true);
        const rect = sourceElement.getBoundingClientRect();
        const cartRect = cartBtn.getBoundingClientRect();

        imgClone.style.width = `${rect.width}px`;
        imgClone.style.height = `${rect.height}px`;
        imgClone.style.position = 'fixed';
        imgClone.style.top = `${rect.top}px`;
        imgClone.style.left = `${rect.left}px`;
        imgClone.style.zIndex = '9999';
        imgClone.classList.add('flying-img');

        document.body.appendChild(imgClone);

        setTimeout(() => {
            imgClone.style.top = `${cartRect.top}px`;
            imgClone.style.left = `${cartRect.left}px`;
            imgClone.style.width = '20px';
            imgClone.style.height = '20px';
            imgClone.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            imgClone.remove();
            // Pulse effect on cart icon
            cartBtn.style.transform = 'scale(1.2)';
            setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
        }, 800);
    };

    window.addProductToCart = (id, event) => {
        // Prevent rapid clicks (debounce / disable)
        if (event && event.target) {
            const btn = event.target.closest('button');
            if (btn) {
                if (btn.disabled) return;
                btn.disabled = true;
                setTimeout(() => {
                    if (btn) btn.disabled = false;
                }, 500);
            }
        }

        const products = getProducts();
        const product = products.find(p => p.id === id);
        if (product) {
            // Find image for animation
            let imgEl = null;
            if (event && event.target) {
                const card = event.target.closest('.product-card');
                if (card) imgEl = card.querySelector('.product-img');
            }
            addToCart(product, imgEl);
        }
    };

    window.orderPromo = (promoName, price) => {
        const message = `¡Hola! Me interesa la promoción:\n\n*${promoName}*\nPrecio: $${price}.00\n\n¿Está disponible?`;
        const url = `${CONFIG.whatsappBase}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    window.sendCartToWhatsApp = () => {
        if (cart.length === 0) {
            showToast('El carrito está vacío', 'error');
            return;
        }

        const profile = JSON.parse(localStorage.getItem('modelorama_profile') || '{}');

        let message = `¡Hola! Quiero hacer un pedido:\n\n`;

        if (profile.name) {
            message += `👤 *Cliente:* ${profile.name}\n`;
        }
        if (profile.phone) {
            message += `📱 *Tel:* ${profile.phone}\n`;
        }
        if (profile.address) {
            message += `🏠 *Dirección:* ${profile.address}\n\n`;
        } else {
            message += `\n`;
        }

        message += `*PEDIDO:*\n`;
        let total = 0;

        cart.forEach(item => {
            let subtotal = 0;
            let note = '';

            if (item.volumeQty && item.volumePrice && item.quantity >= item.volumeQty) {
                const bundles = Math.floor(item.quantity / item.volumeQty);
                const remainder = item.quantity % item.volumeQty;
                subtotal = (bundles * item.volumePrice) + (remainder * item.price);
                note = ` *(Promo: ${item.volumeQty}x$${item.volumePrice.toFixed(2)})*`;
            } else {
                subtotal = item.price * item.quantity;
            }

            total += subtotal;
            message += `• ${item.quantity}x ${item.name} - $${subtotal.toFixed(2)}${note}\n`;
        });

        message += `\n*Total: $${total.toFixed(2)}*\n\n`;

        // Incluir mapa si está disponible
        if (window.userLocation) {
            const mapLink = `https://www.google.com/maps?q=${window.userLocation.lat},${window.userLocation.lng}`;
            message += `📍 *Ubicación GPS:* ${mapLink}\n\n`;
        }

        message += `¿Pueden confirmar disponibilidad y tiempo de entrega?`;

        const url = `${CONFIG.whatsappBase}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        // Cierra el offcanvas
        const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
        if (offcanvas) offcanvas.hide();
    };

    window.clearCart = () => {
        cart = [];
        localStorage.removeItem('modelorama_cart');
        updateCartCount();
        renderCartItems();
        showToast('Carrito vaciado');
    };

    window.removeFromCart = (id) => {
        cart = cart.filter(item => item.id !== id);
        localStorage.setItem('modelorama_cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    };

    window.updateQuantity = (id, delta) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                localStorage.setItem('modelorama_cart', JSON.stringify(cart));
                updateCartCount();
                renderCartItems();
            }
        }
    };

    const renderCartItems = () => {
        const cartContainer = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        if (!cartContainer) return;

        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-cart-x fs-1 text-muted opacity-50"></i>
                    <p class="text-muted mt-3">Tu carrito está vacío</p>
                    <button class="btn btn-sm btn-outline-primary mt-2" data-bs-dismiss="offcanvas">
                        Ir a comprar
                    </button>
                </div>`;
            if (cartTotal) cartTotal.textContent = '$0.00';

            return;
        }

        let total = 0;
        cartContainer.innerHTML = cart.map(item => {
            let subtotal = 0;
            let promoBadge = '';

            if (item.volumeQty && item.volumePrice && item.quantity >= item.volumeQty) {
                const bundles = Math.floor(item.quantity / item.volumeQty);
                const remainder = item.quantity % item.volumeQty;
                subtotal = (bundles * item.volumePrice) + (remainder * item.price);
                promoBadge = `<div class="mt-1"><span class="badge bg-success" style="font-size: 0.6rem;">Promo: ${item.volumeQty}x$${item.volumePrice.toFixed(2)}</span></div>`;
            } else {
                subtotal = item.price * item.quantity;
                if (item.volumeQty && item.volumePrice) {
                    promoBadge = `<div class="mt-1"><span class="badge bg-light text-success border" style="font-size: 0.6rem;">Aprovecha: ${item.volumeQty}x$${item.volumePrice.toFixed(2)}</span></div>`;
                }
            }

            total += subtotal;

            return `
                <div class="cart-item d-flex align-items-center justify-content-between py-3 border-bottom" style="border-color: rgba(0,0,0,0.05) !important;">
                    <div class="d-flex align-items-center w-50">
                        <div class="me-3 p-1 rounded bg-light" style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            ${item.image
                    ? `<img src="${item.image}" alt="${item.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
                    : `<i class="bi ${item.imageIcon || 'bi-box'} ${item.imageColor || 'text-secondary'} fs-4"></i>`}
                        </div>
                        <div style="flex-grow: 1; overflow: hidden;">
                            <div class="fw-bold text-dark text-truncate" style="font-size: 0.85rem;" title="${item.name}">${item.name}</div>
                            <small class="text-secondary" style="white-space: nowrap;">$${item.price.toFixed(2)} c/u</small>
                            ${promoBadge}
                        </div>
                    </div>
                    <div class="d-flex align-items-center bg-light rounded-pill p-1 border">
                        <button class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none" onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span class="fw-bold mx-1" style="font-size: 0.9rem; min-width: 20px; text-align: center;">${item.quantity}</span>
                        <button class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none" onclick="updateQuantity('${item.id}', 1)">+</button>
                    </div>
                    <button class="btn btn-sm text-danger ms-2" onclick="removeFromCart('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
        }).join('');

        if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;

    };

    // Global Modal/Offcanvas Controllers
    window.openCartModal = () => {
        const el = document.getElementById('cartOffcanvas');
        if (el) {
            let offcanvas = bootstrap.Offcanvas.getInstance(el);
            if (!offcanvas) {
                offcanvas = new bootstrap.Offcanvas(el);
            }
            renderCartItems();
            offcanvas.show();
        }
    };

    // Quick View Logic
    let currentQVId = null;
    const qvModal = new bootstrap.Modal(document.getElementById('quickViewModal'));

    window.openQuickView = (id) => {
        const products = getProducts();
        const product = products.find(p => p.id === id);
        if (!product) return;

        currentQVId = id;

        // Reset quantity
        const qvQtyEl = document.getElementById('qvQty');
        if (qvQtyEl) qvQtyEl.textContent = '1';

        // Populate Modal
        document.getElementById('qvBrand').textContent = product.brand;
        document.getElementById('qvName').textContent = product.name;
        document.getElementById('qvDesc').textContent = product.description;
        document.getElementById('qvPrice').textContent = `$${product.price.toFixed(2)}`;

        const oldPriceEl = document.getElementById('qvOldPrice');
        if (product.oldPrice) {
            oldPriceEl.textContent = `$${product.oldPrice.toFixed(2)}`;
            oldPriceEl.style.display = 'inline';
        } else {
            oldPriceEl.style.display = 'none';
        }

        // Combo breakdown
        const comboBreakdown = document.getElementById('qvComboBreakdown');
        const comboItemsEl = document.getElementById('qvComboItems');
        const comboSavingsEl = document.getElementById('qvComboSavings');
        if (comboBreakdown && product.category === 'paquetes' && product.includedProducts && product.includedProducts.length > 0) {
            const items = product.includedProducts.map(item => {
                const pid = typeof item === 'string' ? item : item.id;
                const qty = typeof item === 'string' ? 1 : (item.qty || 1);
                const found = products.find(p => p.id === pid);
                return { name: found ? found.name : pid, qty, price: found ? found.price : 0 };
            });
            comboItemsEl.innerHTML = items.map(i =>
                `<span class="badge bg-light text-dark border">${i.qty > 1 ? i.qty + 'x ' : ''}${i.name}</span>`
            ).join('');
            const individualTotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
            const savings = individualTotal - product.price;
            comboSavingsEl.innerHTML = savings > 0
                ? `<small class="text-muted">Individual: <span class="text-decoration-line-through">$${individualTotal.toFixed(2)}</span></small> <span class="badge bg-success">Ahorras $${savings.toFixed(2)}</span>`
                : '';
            comboBreakdown.style.display = 'block';
        } else if (comboBreakdown) {
            comboBreakdown.style.display = 'none';
        }

        // Image Handling
        const imgEl = document.getElementById('qvImage');
        const iconFallback = document.getElementById('qvIconFallback');
        const iconEl = document.getElementById('qvIcon');

        if (product.image) {
            imgEl.src = product.image;
            imgEl.style.display = 'block';
            iconFallback.style.display = 'none';
            // Simple error fallback
            imgEl.onerror = () => {
                imgEl.style.display = 'none';
                iconFallback.style.display = 'block';
                iconEl.className = `bi ${product.imageIcon} ${product.imageColor} fs-1`;
            };
        } else {
            imgEl.style.display = 'none';
            iconFallback.style.display = 'block';
            iconEl.className = `bi ${product.imageIcon} ${product.imageColor} fs-1`;
        }

        qvModal.show();
    };

    window.addToCartFromQV = () => {
        if (currentQVId) {
            const qty = parseInt(document.getElementById('qvQty')?.textContent) || 1;
            for (let i = 0; i < qty; i++) {
                window.addProductToCart(currentQVId);
            }
            qvModal.hide();
        }
    };

    window.buyNowFromQV = () => {
        if (currentQVId) {
            const qty = parseInt(document.getElementById('qvQty')?.textContent) || 1;
            for (let i = 0; i < qty; i++) {
                window.addProductToCart(currentQVId);
            }
            qvModal.hide();
            setTimeout(() => window.openCartModal(), 300);
        }
    };

    window.changeQVQty = (delta) => {
        const el = document.getElementById('qvQty');
        if (!el) return;
        let qty = parseInt(el.textContent) || 1;
        qty = Math.max(1, qty + delta);
        el.textContent = qty;
    };

    // Toast notification using SweetAlert2
    const showToast = (message, iconType = 'success') => {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: '#ffffff',
                color: '#092440',
                iconColor: '#ffc92c',
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                }
            });

            Toast.fire({
                icon: iconType,
                title: message
            });
        } else {
            // Fallback natively if Swal fails to load
            alert(message);
        }
    };

    // Inicializar contador del carrito
    updateCartCount();

    // ===== AGE VERIFICATION =====
    const initAgeVerification = () => {
        const modal = document.getElementById('ageModal');
        const isVerified = localStorage.getItem(CONFIG.ageKey);

        if (!isVerified) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            modal.style.display = 'none';
        }

        // Expose verify function globally
        window.confirmAge = (isAdult) => {
            if (isAdult) {
                localStorage.setItem(CONFIG.ageKey, 'true');
                modal.classList.remove('d-flex');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            } else {
                window.location.href = 'https://www.google.com';
            }
        };
    };

    // ===== NAVBAR SCROLL EFFECT =====
    const initNavbarScroll = () => {
        const navbar = document.querySelector('.navbar');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    };

    // ===== DYNAMIC CATEGORIES =====
    const renderCategoriesNav = () => {
        const container = document.querySelector('.stories-container');
        if (!container) return;

        const categories = window.appCategories || [];

        // Use a Set to track existing IDs to prevent duplication if called multiple times
        const uniqueCats = [];
        const seen = new Set();

        categories.forEach(c => {
            // Filter out system categories 'all' and 'favorites' if they are in the array
            if (c.id !== 'all' && c.id !== 'favorites' && !seen.has(c.id)) {
                seen.add(c.id);
                uniqueCats.push(c);
            }
        });

        // Determine active category
        const activeTab = container.querySelector('.story-item.active');
        const currentActive = activeTab ? activeTab.dataset.category : 'all';

        // Generate HTML for Static Items
        let html = `
            <div class="story-item ${currentActive === 'all' ? 'active' : ''}" data-category="all">
                <div class="story-ring">
                    <div class="story-circle">
                        <i class="bi bi-grid-fill"></i>
                    </div>
                </div>
                <span>Todos</span>
            </div>
            <div class="story-item ${currentActive === 'favorites' ? 'active' : ''}" data-category="favorites">
                <div class="story-ring ring-red">
                    <div class="story-circle">
                        <i class="bi bi-heart-fill text-danger"></i>
                    </div>
                </div>
                <span>Favoritos</span>
            </div>
        `;

        // Generate HTML for Dynamic Items
        html += uniqueCats.sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 5).map(cat => {
            let innerContent = '';
            if (cat.type === 'image') {
                // Adjust filter for dark/light mode if needed
                innerContent = `<img src="${cat.icon}" alt="${cat.name}" style="width: 24px; object-fit: contain;">`;
            } else {
                innerContent = `<i class="bi ${cat.icon || 'bi-tag'}"></i>`;
            }

            const activeClass = (cat.id === currentActive) ? 'active' : '';

            return `
                <div class="story-item ${activeClass}" data-category="${cat.id}">
                    <div class="story-ring ${cat.ringColor || ''}">
                        <div class="story-circle">
                            ${innerContent}
                        </div>
                    </div>
                    <span>${cat.name}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Populate Navbar Dropdown
        const dropdown = document.getElementById('navCategoryDropdown');
        if (dropdown) {
            let dropHtml = `<li><a class="dropdown-item fw-bold text-primary" href="#productos" onclick="renderProducts('all')"><i class="bi bi-grid-fill me-2"></i>Ver Todo</a></li>
                            <li><hr class="dropdown-divider"></li>`;

            dropHtml += uniqueCats.sort((a, b) => (a.order || 0) - (b.order || 0)).map(cat => {
                return `<li><a class="dropdown-item" href="#productos" onclick="renderProducts('${cat.id}')">
                            <i class="bi ${cat.icon || 'bi-tag'} align-middle me-2"></i>${cat.name}
                        </a></li>`;
            }).join('');
            dropdown.innerHTML = dropHtml;
        }

        // Add Click Listeners
        const tabs = container.querySelectorAll('.story-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all
                container.querySelectorAll('.story-item').forEach(t => t.classList.remove('active'));
                // Add active to clicked
                tab.classList.add('active');

                // Sync category dropdown
                window.dispatchEvent(new CustomEvent('categorySelectedFromStory', { detail: { category: tab.dataset.category } }));

                // Render products
                renderProducts(tab.dataset.category);
            });
        });
    };

    // Listen for category updates
    window.addEventListener('categoriesUpdated', renderCategoriesNav);

    // Initial Render
    setTimeout(renderCategoriesNav, 100);

    // ===== CATEGORY HIGHLIGHT =====
    window.renderPromotions = () => {
        const promoContainer = document.getElementById('promoContainer');
        if (!promoContainer) return;

        const allProducts = getProducts() || [];
        let promos = allProducts.filter(p => p.isFeatured === true && p.active !== false && p.category !== 'paquetes').slice(0, 3);

        // FALLBACK: Si el administrador no ha marcado ningún producto manualmente como "Destacado", 
        // mostraremos automáticamente los que tengan ofertas o etiquetas.
        if (promos.length === 0) {
            promos = allProducts.filter(p => (p.promo || p.oldPrice) && p.active !== false && p.category !== 'paquetes').slice(0, 3);
        }

        if (promos.length === 0) {
            const section = document.getElementById('promociones');
            if (section) section.style.display = 'none';
            return;
        } else {
            const section = document.getElementById('promociones');
            if (section) section.style.display = 'block';
        }

        promoContainer.innerHTML = promos.map((p, index) => {
            const delay = (index + 1) * 100;
            const badgeClass = p.promo === 'OFERTA' ? 'bg-danger' : (p.promo === 'NUEVO' ? 'bg-primary' : 'bg-warning text-dark');
            const glowClass = p.promo === 'OFERTA' ? 'glow-blue' : 'glow-gold';

            return `
                <div class="col-6 col-lg-4 fade-in delay-${delay} visible">
                    <div class="promo-card ${p.promo === 'OFERTA' ? 'featured' : ''}">
                        <div class="promo-bg-glow ${glowClass}"></div>
                        ${p.promo ? `<div class="promo-badge ${badgeClass}">${p.promo}</div>` : ''}
                        <div class="promo-image">
                            ${p.image
                    ? `<img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200/0a192f/ffd700?text=${encodeURIComponent(p.name)}'">`
                    : `<i class="bi ${p.imageIcon || 'bi-box'} ${p.imageColor || 'text-gold'} fs-1 text-center mt-5 d-block"></i>`}
                        </div>
                        <div class="promo-content">
                            <h3 class="h4 text-white text-truncate" title="${p.name}">${p.name}</h3>
                            <p class="text-muted text-truncate">${p.description || p.category}</p>
                            <div class="promo-price">
                                $${Math.floor(p.price)}<span class="fs-6">.${(p.price % 1).toFixed(2).substring(2)}</span>
                            </div>
                            ${p.oldPrice ? `<p class="promo-price-old">$${p.oldPrice.toFixed(2)}</p>` : '<p class="promo-price-old" style="visibility:hidden;">$0</p>'}
                            <button class="btn btn-premium-primary w-100 mt-2" onclick="addProductToCart('${p.id}', event)">
                                <i class="bi bi-cart-plus me-2"></i>Agregar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // ===== PRODUCT RENDERING & FILTERING =====
    window.renderProducts = (filterCategory = 'all', isSearch = false) => {
        const grid = document.getElementById('productsGrid');

        // Only show skeletons if it's NOT a search update to avoid flickering
        if (!isSearch) {
            grid.innerHTML = Array(8).fill(0).map(() => `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="skeleton-card">
                        <div class="skeleton skeleton-img"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text short"></div>
                        <div class="skeleton skeleton-text short"></div>
                    </div>
                </div>
            `).join('');
        }

        const products = getProducts(); // From products.js
        const searchQuery = document.getElementById('productSearch') ? document.getElementById('productSearch').value.toLowerCase() : '';

        // Definir orden de jerarquía de categorías: Cervezas primero, luego botanas, etc.
        const categoryPriority = {
            'corona': 1, 'modelo': 2, 'victoria': 3, 'pacifico': 4,
            'licores': 5, 'aguas': 6, 'botanas': 7, 'dulces': 8, 'otros': 9
        };

        const sortedProducts = [...products].sort((a, b) => {
            const priorityA = categoryPriority[a.category] || 99;
            const priorityB = categoryPriority[b.category] || 99;
            return priorityA - priorityB;
        });

        // Immediate render without artificial delay
        grid.innerHTML = '';
        let hasProducts = false;

        sortedProducts.forEach((product, index) => {
            // Skip packages — they render in the combos section
            if (product.category === 'paquetes') return;
            // Skip inactive products
            if (product.active === false) return;

            // Filter logic
            const matchesCategory = filterCategory === 'all' ||
                (filterCategory === 'favorites' && isFavorite(product.id)) ||
                product.category === filterCategory;

            const matchesSearch = product.name.toLowerCase().includes(searchQuery) ||
                product.brand.toLowerCase().includes(searchQuery);

            if (matchesCategory && matchesSearch) {
                hasProducts = true;
                const productEl = document.createElement('div');
                productEl.className = 'col-6 col-md-4 col-lg-3 product-item fade-in';
                productEl.dataset.category = product.category;
                productEl.style.animationDelay = `${index * 0.05}s`; // Faster stagger

                const oldPriceHtml = product.oldPrice
                    ? `<span class="product-old-price me-2">$${product.oldPrice.toFixed(2)}</span>`
                    : '';

                const badgeHtml = product.promo
                    ? `<div class="card-badge badge-promo">${product.promo}</div>`
                    : '';

                const coldBadgeHtml = product.cold
                    ? `<div class="card-badge badge-cold"><i class="bi bi-snow"></i> FRÍA</div>`
                    : '';

                const imageHtml = product.image
                    ? `<img src="${product.image}" alt="${product.name}" class="product-img w-100 h-100 object-fit-contain p-2" 
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <div class="product-img-fallback justify-content-center align-items-center w-100 h-100 bg-light" style="display:none; min-height: 200px;">
                                <i class="bi ${product.imageIcon || 'bi-image'} ${product.imageColor || 'text-secondary'}" style="font-size: 4rem;"></i>
                           </div>`
                    : `<div class="product-img-fallback d-flex justify-content-center align-items-center w-100 h-100 bg-light" style="min-height: 200px;">
                                <i class="bi ${product.imageIcon || 'bi-image'} ${product.imageColor || 'text-secondary'}" style="font-size: 4rem;"></i>
                           </div>`;

                // Favorite Icon Status
                const favIconClass = isFavorite(product.id) ? 'bi-heart-fill text-danger' : 'bi-heart';

                productEl.innerHTML = `
                        <div class="product-card">
                            ${badgeHtml}
                            ${coldBadgeHtml}
                            
                            <div class="position-absolute top-0 start-0 m-3 d-flex flex-column gap-3" style="z-index: 5;">
                                <button class="btn btn-sm border-0 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                                    style="width: 35px; height: 35px;"
                                    onclick="event.preventDefault(); toggleFavorite('${product.id}')" title="Favorito">
                                    <i class="bi ${favIconClass} fs-6"></i>
                                </button>
                                <button class="btn btn-sm border-0 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                                    style="width: 35px; height: 35px;"
                                    onclick="event.preventDefault(); window.openQuickView('${product.id}')" title="Vista Rápida">
                                    <i class="bi bi-eye-fill text-primary fs-6"></i>
                                </button>
                            </div>

                            <div class="product-image" onclick="window.openQuickView('${product.id}')" style="cursor: pointer;">
                                ${imageHtml}
                            </div>
                            <div class="product-info">
                                <span class="product-brand text-primary">${product.brand}</span>
                                <h5 class="product-name">${product.name}</h5>
                                <p class="card-text text-secondary small mb-3 description-truncate">${product.description}</p>
                                <div class="d-flex justify-content-between align-items-center border-top border-secondary pt-3 mt-auto" style="border-color: rgba(255,255,255,0.05) !important;">
                                    <div class="price-container">
                                        ${oldPriceHtml}
                                        <span class="product-price">$${product.price.toFixed(2)}</span>
                                    </div>
                                    <button class="add-to-cart-btn position-relative" style="z-index: 10;" onclick="event.preventDefault(); event.stopPropagation(); window.addProductToCart('${product.id}', event)" title="Agregar al carrito">
                                        <i class="bi bi-plus-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                grid.appendChild(productEl);

                // Add 3D Tilt & Glow Event Listeners
                const card = productEl.querySelector('.product-card');

                card.addEventListener('mousemove', e => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left; // x position within the element.
                    const y = e.clientY - rect.top;  // y position within the element.

                    // Set CSS variables for Glow spotlight
                    card.style.setProperty('--mouse-x', `${x}px`);
                    card.style.setProperty('--mouse-y', `${y}px`);

                    // Calculate rotation (max 10 degrees)
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * -10;
                    const rotateY = ((x - centerX) / centerX) * 10;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                });

                // Trigger entrance animation
                setTimeout(() => productEl.classList.add('visible'), 50 + (index * 50));
            }
        });

        // Si no hay productos
        if (!hasProducts) {
            grid.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No hay productos que coincidan con tu búsqueda.</p></div>';
        }
    };

    // ===== COMBOS RENDERING =====
    const renderCombos = () => {
        const grid = document.getElementById('combosGrid');
        const section = document.getElementById('combos');
        if (!grid || !section) return;

        const allProducts = getProducts() || [];
        const combos = allProducts.filter(p => p.category === 'paquetes' && p.active !== false);

        if (combos.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        grid.innerHTML = '';

        combos.forEach((combo) => {
            // Build included items breakdown
            let breakdownHtml = '';
            let individualTotal = 0;
            if (combo.includedProducts && combo.includedProducts.length > 0) {
                const items = combo.includedProducts.map(item => {
                    const pid = typeof item === 'string' ? item : item.id;
                    const qty = typeof item === 'string' ? 1 : (item.qty || 1);
                    const found = allProducts.find(p => p.id === pid);
                    const price = found ? found.price : 0;
                    individualTotal += price * qty;
                    return {
                        name: found ? found.name : pid,
                        qty,
                        price,
                        image: found ? found.image : '',
                        icon: found ? found.imageIcon : 'bi-box',
                        color: found ? found.imageColor : 'text-muted'
                    };
                });
                breakdownHtml = items.map(i => `
                    <div class="d-flex align-items-center gap-2 py-1">
                        <span class="badge bg-primary rounded-pill" style="min-width:28px;">${i.qty}x</span>
                        ${i.image ? `<img src="${i.image}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;">` : `<i class="bi ${i.icon || 'bi-box'} ${i.color || ''}"></i>`}
                        <span class="small flex-grow-1">${i.name}</span>
                        <span class="small text-muted">$${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                `).join('');
            }

            const savings = individualTotal - combo.price;
            const savingsHtml = savings > 0
                ? `<div class="combo-savings-badge"><i class="bi bi-piggy-bank me-1"></i>Ahorras $${savings.toFixed(2)}</div>`
                : '';

            const imageHtml = combo.image
                ? `<img src="${combo.image}" alt="${combo.name}" class="w-100 h-100" style="object-fit:cover;">`
                : `<div class="d-flex align-items-center justify-content-center w-100 h-100 bg-light"><i class="bi bi-gift text-danger" style="font-size:3rem;"></i></div>`;

            const el = document.createElement('div');
            el.className = 'col-12 col-md-6 fade-in';
            el.innerHTML = `
                <div class="combo-card">
                    <div class="row g-0 h-100">
                        <div class="col-4 combo-card-image" onclick="window.openQuickView('${combo.id}')" style="cursor:pointer;">
                            ${imageHtml}
                            ${savingsHtml}
                        </div>
                        <div class="col-8 p-3 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h5 class="fw-bold mb-0" style="color: var(--primary-blue);">${combo.name}</h5>
                                <span class="badge bg-danger">COMBO</span>
                            </div>
                            <p class="text-muted small mb-2">${combo.description || ''}</p>
                            <div class="combo-items-list flex-grow-1">
                                ${breakdownHtml}
                            </div>
                            <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top" style="border-color:rgba(0,0,0,0.08)!important;">
                                <div>
                                    ${individualTotal > combo.price ? `<small class="text-decoration-line-through text-muted me-1">$${individualTotal.toFixed(2)}</small>` : ''}
                                    <span class="fw-bold fs-5" style="color: var(--primary-blue);">$${combo.price.toFixed(2)}</span>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="d-flex align-items-center bg-light rounded-pill p-1 border">
                                        <button class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none" onclick="changeComboQty('${combo.id}', -1)">-</button>
                                        <span id="comboQty-${combo.id}" class="fw-bold mx-1" style="font-size:0.9rem;min-width:20px;text-align:center;">1</span>
                                        <button class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none" onclick="changeComboQty('${combo.id}', 1)">+</button>
                                    </div>
                                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addComboToCart('${combo.id}')" title="Agregar al carrito">
                                        <i class="bi bi-plus-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(el);
            setTimeout(() => el.classList.add('visible'), 100);
        });
    };

    window.changeComboQty = (comboId, delta) => {
        const el = document.getElementById(`comboQty-${comboId}`);
        if (!el) return;
        let qty = parseInt(el.textContent) || 1;
        qty = Math.max(1, qty + delta);
        el.textContent = qty;
    };

    window.addComboToCart = (comboId) => {
        const products = getProducts();
        const combo = products.find(p => p.id === comboId);
        if (!combo) return;
        const qtyEl = document.getElementById(`comboQty-${comboId}`);
        const qty = parseInt(qtyEl?.textContent) || 1;
        for (let i = 0; i < qty; i++) {
            addToCart(combo);
        }
        // Reset qty display
        if (qtyEl) qtyEl.textContent = '1';
    };

    // ===== CATEGORY DROPDOWN WITH AUTOCOMPLETE =====
    const initCategoryDropdown = () => {
        const dropdownInput = document.getElementById('categoryDropdownInput');
        const dropdownList = document.getElementById('categoryDropdownList');
        const dropdownContainer = document.querySelector('.category-dropdown-container');
        if (!dropdownInput || !dropdownList) return;

        const getDropdownCategories = () => {
            const cats = [{ id: 'all', name: 'Todas', icon: 'bi-grid-fill' }, { id: 'favorites', name: 'Favoritos', icon: 'bi-heart-fill' }];
            const appCats = window.appCategories || [];
            appCats.forEach(c => {
                if (c.id !== 'all' && c.id !== 'favorites') {
                    cats.push({ id: c.id, name: c.name, icon: c.icon || 'bi-tag' });
                }
            });
            return cats;
        };

        const renderDropdownItems = (filter = '') => {
            const cats = getDropdownCategories();
            const query = filter.toLowerCase().trim();
            const filtered = query ? cats.filter(c => c.name.toLowerCase().includes(query)) : cats;
            const selectedId = dropdownInput.dataset.selectedCategory || 'all';

            if (filtered.length === 0) {
                dropdownList.innerHTML = '<li class="category-dropdown-item text-muted" style="pointer-events:none;"><i class="bi bi-x-circle"></i> Sin resultados</li>';
            } else {
                dropdownList.innerHTML = filtered.map(c => `
                    <li class="category-dropdown-item ${c.id === selectedId ? 'active' : ''}" data-category-id="${c.id}">
                        <i class="bi ${c.icon}"></i>
                        <span>${c.name}</span>
                    </li>
                `).join('');
            }

            dropdownList.querySelectorAll('.category-dropdown-item[data-category-id]').forEach(item => {
                item.addEventListener('click', () => {
                    const catId = item.dataset.categoryId;
                    const catName = item.querySelector('span').textContent;
                    selectDropdownCategory(catId, catName);
                });
            });
        };

        const selectDropdownCategory = (catId, catName) => {
            dropdownInput.value = catName === 'Todas' ? '' : catName;
            dropdownInput.placeholder = catName;
            dropdownInput.dataset.selectedCategory = catId;
            closeDropdown();

            // Sync with stories
            const storiesContainer = document.querySelector('.stories-container');
            if (storiesContainer) {
                storiesContainer.querySelectorAll('.story-item').forEach(s => s.classList.remove('active'));
                const match = storiesContainer.querySelector(`.story-item[data-category="${catId}"]`);
                if (match) {
                    match.classList.add('active');
                    match.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }

            // Re-render products with new category
            const searchQuery = document.getElementById('productSearch');
            renderProducts(catId, !!searchQuery?.value);
        };

        const openDropdown = () => {
            renderDropdownItems('');
            dropdownList.style.display = 'block';
            dropdownContainer.classList.add('open');
        };

        const closeDropdown = () => {
            dropdownList.style.display = 'none';
            dropdownContainer.classList.remove('open');
        };

        dropdownInput.addEventListener('focus', () => {
            dropdownInput.value = '';
            openDropdown();
        });

        dropdownInput.addEventListener('input', () => {
            renderDropdownItems(dropdownInput.value);
            dropdownList.style.display = 'block';
            dropdownContainer.classList.add('open');
        });

        // Close on blur (delayed to allow click)
        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                closeDropdown();
                // Restore display name if input was left dirty
                const selectedId = dropdownInput.dataset.selectedCategory || 'all';
                const cats = getDropdownCategories();
                const found = cats.find(c => c.id === selectedId);
                dropdownInput.value = (found && found.name !== 'Todas') ? found.name : '';
                dropdownInput.placeholder = found ? found.name : 'Todas';
            }
        });

        // Sync: when a story-item is clicked, update dropdown
        window.addEventListener('categorySelectedFromStory', (e) => {
            const catId = e.detail.category;
            const cats = getDropdownCategories();
            const found = cats.find(c => c.id === catId);
            if (found) {
                dropdownInput.value = found.name === 'Todas' ? '' : found.name;
                dropdownInput.placeholder = found.name;
                dropdownInput.dataset.selectedCategory = found.id;
            }
        });

        // Also refresh when categories are updated from Firestore
        window.addEventListener('categoriesUpdated', () => {
            const selectedId = dropdownInput.dataset.selectedCategory || 'all';
            const cats = getDropdownCategories();
            const found = cats.find(c => c.id === selectedId);
            if (found) {
                dropdownInput.placeholder = found.name;
            }
        });
    };

    // Listeners for data loaded from Firestore
    window.addEventListener('productsUpdated', () => {
        renderProducts();
        renderCombos();
        renderPromotions();
        updateFavoritesList();

        // Setup Search
        const searchInput = document.getElementById('searchProduct');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                renderProducts('all', term);
            });
        }
    });

    window.addEventListener('categoriesUpdated', () => {
        renderCategoriesNav();


        // Ensure that new categories are seeded if missing
        if (window.appCategories && window.appCategories.length > 0 && typeof addCategory === 'function') {
            const newCats = [
                { id: 'aguas', name: 'Aguas', type: 'icon', icon: 'bi-droplet-half text-info', ringColor: 'ring-cyan', order: 8 },
                { id: 'dulces', name: 'Dulces', type: 'icon', icon: 'bi-box-seam text-danger', ringColor: 'ring-red', order: 9 }
            ];
            newCats.forEach(c => {
                if (!window.appCategories.find(x => x.id === c.id)) {
                    addCategory(c);
                }
            });
        }
    });

    const initProductFilters = () => {
        const searchInput = document.getElementById('productSearch');
        const searchDropdown = document.getElementById('searchDropdown');

        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                // Get category from dropdown first, then fallback to stories
                const catDropdown = document.getElementById('categoryDropdownInput');
                const category = catDropdown ? (catDropdown.dataset.selectedCategory || 'all') : (
                    (document.querySelector('.category-btn.active') || document.querySelector('.story-item.active'))?.dataset.category || 'all'
                );
                const query = searchInput.value.toLowerCase().trim();

                // Update grid
                renderProducts(category, true);

                // Autocomplete Dropdown Logic
                if (query.length > 0 && searchDropdown) {
                    const products = getProducts();
                    const filtered = products.filter(p => {
                        const matchesCat = category === 'all' ||
                            (category === 'favorites' && isFavorite(p.id)) ||
                            p.category === category;
                        const matchesText = p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query);
                        return matchesCat && matchesText;
                    }).slice(0, 6); // Max 6 suggestions

                    if (filtered.length > 0) {
                        searchDropdown.innerHTML = filtered.map(p => `
                            <li class="list-group-item list-group-item-action border-0 border-bottom d-flex align-items-center" style="cursor: pointer;" onclick="window.selectSearchResult('${p.name}')">
                                <i class="bi bi-search me-3 text-muted"></i>
                                <div>
                                    <div class="fw-bold text-dark" style="font-size: 0.9rem;">${p.name}</div>
                                    <small class="text-muted" style="font-size: 0.75rem;">${p.brand}</small>
                                </div>
                            </li>
                        `).join('');
                        searchDropdown.style.display = 'block';
                    } else {
                        searchDropdown.style.display = 'none';
                    }
                } else if (searchDropdown) {
                    searchDropdown.style.display = 'none';
                }
            });

            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (searchDropdown && !searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                    searchDropdown.style.display = 'none';
                }
            });

            // Expose globally to handle clicks
            window.selectSearchResult = (name) => {
                searchInput.value = name;
                if (searchDropdown) searchDropdown.style.display = 'none';
                const catDropdown = document.getElementById('categoryDropdownInput');
                const category = catDropdown ? (catDropdown.dataset.selectedCategory || 'all') : (
                    (document.querySelector('.category-btn.active') || document.querySelector('.story-item.active'))?.dataset.category || 'all'
                );
                renderProducts(category, true);
            };
        }

        window.addEventListener('productsUpdated', () => {
            const activeTab = document.querySelector('.category-btn.active') || document.querySelector('.story-item.active');
            const category = activeTab ? activeTab.dataset.category : 'all';
            renderProducts(category);
            renderCombos();

            // Si estamos en la página de admin, actualizar la tabla también
            if (window.renderAdminProducts) {
                window.renderAdminProducts();
            }
        });

        // Listen for Firebase Categories Updates
        window.addEventListener('categoriesUpdated', () => {
            renderCategories();

            const activeTab = document.querySelector('.category-btn.active');
            const category = activeTab ? activeTab.dataset.category : 'all';
            renderProducts(category);
            renderCombos();

            // Admin update
            if (window.renderAdminCategories) {
                window.renderAdminCategories();
            }
        });
    };

    const renderCategories = () => {
        const container = document.querySelector('.categories-container');
        if (!container) return; // Not on main page

        const categories = window.appCategories || [];

        // Preserve active state if possible
        const activeTab = document.querySelector('.category-btn.active');
        const activeCategory = activeTab ? activeTab.dataset.category : 'all';

        let html = `
            <button class="btn category-btn rounded-pill px-4 py-2 fw-bold shadow-sm ${activeCategory === 'all' ? 'btn-primary active' : 'btn-light btn-outline-primary'}" data-category="all" onclick="selectCategory('all')">
                <i class="bi bi-grid-fill me-2"></i> Todos
            </button>
            <button class="btn category-btn rounded-pill px-4 py-2 fw-bold shadow-sm ${activeCategory === 'favorites' ? 'btn-primary active' : 'btn-light btn-outline-primary'}" data-category="favorites" onclick="selectCategory('favorites')">
                <i class="bi bi-heart-fill text-danger me-2"></i> Favoritos
            </button>
        `;

        categories.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(cat => {
            let innerContent = '';
            if (cat.type === 'image' && cat.icon) {
                innerContent = `<img src="${cat.icon}" alt="${cat.name}" style="width: 20px; object-fit: contain; margin-right: 8px;">`;
            } else {
                innerContent = `<i class="bi ${cat.icon || 'bi-tag'} me-2"></i>`;
            }

            html += `
                <button class="btn category-btn rounded-pill px-4 py-2 fw-bold shadow-sm ${activeCategory === cat.id ? 'btn-primary active' : 'btn-outline-dark text-secondary border-2'}" data-category="${cat.id}" onclick="selectCategory('${cat.id}')">
                    ${innerContent} ${cat.name}
                </button>
            `;
        });

        container.innerHTML = html;
    };

    // Expose for onClick
    window.selectCategory = (categoryId) => {
        const items = document.querySelectorAll('.category-btn');
        items.forEach(item => {
            item.classList.remove('active', 'btn-primary');
            item.classList.add('btn-outline-dark', 'text-secondary', 'border-2');
        });

        const selected = document.querySelector(`.category-btn[data-category="${categoryId}"]`);
        if (selected) {
            selected.classList.remove('btn-outline-dark', 'text-secondary', 'border-2');
            selected.classList.add('active', 'btn-primary');
            selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        renderProducts(categoryId);
    };

    // ===== SCROLL ANIMATIONS (Intersection Observer) =====
    const initScrollAnimations = () => {
        const elements = document.querySelectorAll('.fade-in');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: Stop observing once visible to prevent re-animating
                    // observer.unobserve(entry.target); 
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(el => observer.observe(el));
    };

    // ===== SMOOTH SCROLLING FOR ANCHORS =====
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    // Close mobile menu if open
                    const navCollapse = document.querySelector('.navbar-collapse');
                    if (navCollapse && navCollapse.classList.contains('show')) {
                        // Bootstrap 5 specific way to toggle would be via instance, 
                        // but simple removing 'show' works for visual hiding usually
                        // refined:
                        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                        if (bsCollapse) bsCollapse.hide();
                    }

                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            });
        });
    };

    // ===== MAP LOCATION INIT =====
    const initMapLocation = () => {
        const docRef = db.collection('settings').doc('store');
        docRef.get().then(doc => {
            if (doc.exists && doc.data().mapUrl) {
                const mapLink = document.getElementById('navMapLink');
                if (mapLink) {
                    mapLink.href = doc.data().mapUrl;
                    mapLink.style.display = 'flex';
                }
            }
        }).catch(err => console.error("Error loading map setting:", err));
    };

    // ===== INITIALIZE ALL =====
    initTheme(); // Set theme first
    initAgeVerification();
    initNavbarScroll();
    initCategoryDropdown();
    initProductFilters();
    initScrollAnimations();
    initSmoothScroll();
    initMapLocation();

    // Render cart and map when modal/offcanvas opens
    const cartOffcanvas = document.getElementById('cartOffcanvas');
    if (cartOffcanvas) {
        cartOffcanvas.addEventListener('shown.bs.offcanvas', () => {
            renderCartItems();

            // Re-init map if needed
            const mapSection = document.getElementById('mapSection');
            const cart = JSON.parse(localStorage.getItem('modelorama_cart') || '[]');

            if (cart.length > 0) {
                mapSection.style.display = 'block';
                // Small delay to ensure container is visible before Leaflet calculates size
                setTimeout(() => {
                    if (window.initMap) window.initMap();
                }, 200);
            } else {
                mapSection.style.display = 'none';
            }
        });
    }

    console.log('Modelorama Premium Script Loaded');
});