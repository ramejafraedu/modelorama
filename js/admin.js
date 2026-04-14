// ===== AUTHENTICATION (runs BEFORE DOMContentLoaded for overlay) =====
const ADMIN_SETTINGS_REF = () => db.collection('settings');

// Check session immediately via onAuthStateChanged
firebase.auth().onAuthStateChanged((user) => {
    const overlay = document.getElementById('loginOverlay');
    if (user) {
        if (overlay) overlay.style.display = 'none';
    } else {
        if (overlay) overlay.style.display = 'flex';
    }
});

// Login attempt
window.attemptLogin = async () => {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('loginError');

    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        if (!email) emailInput.focus();
        else passInput.focus();
        return;
    }

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // Overlay will be hidden automatically by onAuthStateChanged
        errorDiv.style.display = 'none';
        emailInput.value = '';
        passInput.value = '';
    } catch (err) {
        console.error('Login error:', err);
        errorDiv.style.display = 'block';
        passInput.value = '';
        passInput.focus();
    }
};

// Change password (using Firebase Auth)
window.changePassword = async () => {
    const newPass = document.getElementById('newPassword').value.trim();
    const confirm = document.getElementById('confirmPassword').value.trim();

    if (!newPass || !confirm) {
        Swal.fire({ icon: 'error', title: 'Campos vacíos', text: 'Completa todos los campos de contraseña.' });
        return;
    }

    if (newPass.length < 6) {
        Swal.fire({ icon: 'error', title: 'Muy corta', text: 'La contraseña debe tener al menos 6 caracteres (Firebase).' });
        return;
    }

    if (newPass !== confirm) {
        Swal.fire({ icon: 'error', title: 'No coinciden', text: 'La nueva contraseña y la confirmación no coinciden.' });
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        Swal.fire({ icon: 'error', title: 'No autenticado', text: 'No tienes sesión en Firebase Auth.' });
        return;
    }

    try {
        await user.updatePassword(newPass);

        // Clear form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        Swal.fire({ icon: 'success', title: '¡Actualizada!', text: 'Tu contraseña ha sido cambiada.', timer: 2000, showConfirmButton: false });
    } catch (err) {
        console.error('Password change error:', err);
        if (err.code === 'auth/requires-recent-login') {
            Swal.fire({ icon: 'error', title: 'Requiere relogueo', text: 'Por seguridad, debes cerrar sesión e iniciar de nuevo para cambiar la contraseña.' });
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar la contraseña: ' + err.message });
        }
    }
};

// Create New Admin (using Firebase Auth)
window.createNewAdmin = async () => {
    const emailInput = document.getElementById('newAdminEmail');
    const passInput = document.getElementById('newAdminPass');
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        Swal.fire({ icon: 'warning', title: 'Campos vacíos', text: 'Ingresa un correo y una contraseña.' });
        return;
    }

    if (password.length < 6) {
        Swal.fire({ icon: 'error', title: 'Muy corta', text: 'Firebase exige un mínimo de 6 caracteres.' });
        return;
    }

    try {
        // Firebase Auth immediately signs in the new user after creation
        await firebase.auth().createUserWithEmailAndPassword(email, password);

        emailInput.value = '';
        passInput.value = '';

        Swal.fire({
            icon: 'success',
            title: '¡Administrador Creado!',
            text: 'La cuenta se ha registrado con éxito.',
            timer: 3000,
            showConfirmButton: false
        });
    } catch (err) {
        console.error('Create admin error:', err);
        let errorMsg = err.message;
        if (err.code === 'auth/email-already-in-use') {
            errorMsg = 'Este correo ya está registrado como administrador.';
        } else if (err.code === 'auth/invalid-email') {
            errorMsg = 'El formato del correo es inválido.';
        }
        Swal.fire({ icon: 'error', title: 'Error', text: errorMsg });
    }
};

// Save legal content
window.saveLegalContent = async (type) => {
    const fieldMap = { privacy: 'settingsPrivacy', terms: 'settingsTerms' };
    const textarea = document.getElementById(fieldMap[type]);
    if (!textarea) return;

    const content = textarea.value.trim();

    try {
        await db.collection('settings').doc('legal').set(
            { [type]: content },
            { merge: true }
        );
        const titleMap = { privacy: 'Aviso de Privacidad', terms: 'Términos y Condiciones' };
        Swal.fire({ icon: 'success', title: '¡Guardado!', text: `${titleMap[type]} actualizado.`, timer: 1500, showConfirmButton: false });
    } catch (err) {
        console.error('Save legal error:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' });
    }
};

// Save store info (WhatsApp, etc)
window.saveStoreInfo = async () => {
    const whatsapp = document.getElementById('settingsWhatsapp').value.trim();
    const mapUrl = document.getElementById('settingsMapUrl').value.trim();

    if (!whatsapp) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'El número de WhatsApp no puede estar vacío.' });
        return;
    }

    try {
        await db.collection('settings').doc('store').set(
            { whatsapp: whatsapp, mapUrl: mapUrl },
            { merge: true }
        );
        Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Información de la tienda actualizada.', timer: 1500, showConfirmButton: false });
    } catch (err) {
        console.error('Save store info error:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la información de la tienda.' });
    }
};

// Load legal content into settings textareas
function loadLegalContent() {
    db.collection('settings').doc('legal').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const privacyEl = document.getElementById('settingsPrivacy');
            const termsEl = document.getElementById('settingsTerms');
            if (privacyEl && data.privacy) privacyEl.value = data.privacy;
            if (termsEl && data.terms) termsEl.value = data.terms;
        }
    }).catch(err => console.error('Load legal error:', err));
}

// Load store info
function loadStoreInfo() {
    db.collection('settings').doc('store').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.whatsapp) {
                const input = document.getElementById('settingsWhatsapp');
                if (input) input.value = data.whatsapp;
            }
            if (data.mapUrl !== undefined) {
                const mapInput = document.getElementById('settingsMapUrl');
                if (mapInput) mapInput.value = data.mapUrl;
            }
        }
    }).catch(err => console.error('Load store info error:', err));
}

document.addEventListener('DOMContentLoaded', () => {

    // Load legal content into settings tab
    loadLegalContent();
    loadStoreInfo();

    // ===== Modals & State =====
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));

    let isEditingProduct = false;
    let isEditingCategory = false;


    // ===== ADMIN STATS =====
    const updateAdminStats = () => {
        const allItems = typeof getProducts === 'function' ? (getProducts() || []) : [];
        const products = allItems.filter(p => p.category !== 'paquetes');
        const packages = allItems.filter(p => p.category === 'paquetes');
        const categories = window.appCategories || [];
        const coldProducts = products.filter(p => p.cold);

        const elProducts = document.getElementById('statProducts');
        const elPackages = document.getElementById('statPackages');
        const elCategories = document.getElementById('statCategories');
        const elCold = document.getElementById('statCold');

        if (elProducts) elProducts.textContent = products.length;
        if (elPackages) elPackages.textContent = packages.length;
        if (elCategories) elCategories.textContent = categories.length;
        if (elCold) elCold.textContent = coldProducts.length;
    };

    // ===== INIT DATA BINDING =====
    window.addEventListener('productsUpdated', () => {
        renderAdminProducts();
        renderAdminPackages();
        updateAdminStats();
    });

    window.addEventListener('categoriesUpdated', () => {
        renderAdminCategories();
        updateCategoryDropdowns();
        updateAdminStats();
    });

    // Timeout fallback if event fires before DOM binds
    setTimeout(() => {
        if (window.appProducts && window.appProducts.length > 0) {
            renderAdminProducts();
            renderAdminPackages();
        }
        if (window.appCategories && window.appCategories.length > 0) {
            renderAdminCategories();
            updateCategoryDropdowns();
        }
        updateAdminStats();
    }, 1000);


    // ===== TABS & MOBILE FAB =====
    const tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            updateMobileFab(event.target.id);
        });
    });

    function updateMobileFab(activeTabId) {
        const fab = document.getElementById('mobileFab');
        if (!fab) return;

        fab.classList.remove('btn-premium-primary', 'btn-danger', 'btn-info');
        fab.innerHTML = '<i class="bi bi-plus-lg"></i>';

        if (activeTabId === 'products-tab') {
            fab.classList.add('btn-premium-primary');
            fab.onclick = openAddProductModal;
        } else if (activeTabId === 'packages-tab') {
            fab.classList.add('btn-danger'); // Match tab icon color
            fab.onclick = openAddPackageModal;
        } else if (activeTabId === 'categories-tab') {
            fab.classList.add('btn-info');
            fab.onclick = openAddCategoryModal;
        }
    }


    /* =========================================
       1. PRODUCTS & PACKAGES LOGIC
       ========================================= */

    window.renderAdminProducts = () => {
        const tableBody = document.getElementById('adminProductTable');
        const searchInput = document.getElementById('adminSearch');
        if (!tableBody) return;

        const query = searchInput ? searchInput.value.toLowerCase() : '';
        const allItems = getProducts() || [];

        // Filter out packages for this table
        const products = allItems.filter(p => p.category !== 'paquetes');

        tableBody.innerHTML = '';

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay productos.</td></tr>';
            return;
        }

        products.forEach(product => {
            if (product.name.toLowerCase().includes(query) || product.brand.toLowerCase().includes(query)) {
                const row = document.createElement('tr');

                // Determine what to show as image/icon
                let mediaHtml = '';
                if (product.image) {
                    mediaHtml = `<img src="${product.image}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;">`;
                } else {
                    mediaHtml = `<div class="bg-light rounded d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;"><i class="bi border-0 ${product.imageIcon || 'bi-box'} ${product.imageColor || 'text-secondary'}"></i></div>`;
                }

                const catObj = (window.appCategories || []).find(c => c.id === product.category);
                const catName = catObj ? catObj.name : product.category;
                const activeBadge = product.active === false ? '<span class="badge bg-danger ms-2" style="font-size:0.6rem;">OCULTO</span>' : '';
                const featuredBadge = product.isFeatured ? '<span class="badge bg-warning text-dark ms-1" style="font-size:0.6rem;"><i class="bi bi-star-fill"></i> PORTADA</span>' : '';

                row.innerHTML = `
                    <td style="${product.active === false ? 'opacity: 0.6;' : ''}">
                        <div class="d-flex align-items-center gap-3">
                            ${mediaHtml}
                            <div>
                                <div class="fw-semibold">${product.name} ${product.promo ? `<span class="badge bg-secondary text-white ms-2" style="font-size:0.6rem;">${product.promo}</span>` : ''} ${product.oldPrice ? '<span class="badge bg-success ms-1" style="font-size:0.6rem;">OFERTA</span>' : ''}${featuredBadge}${activeBadge}</div>
                                <div class="text-muted small">${product.brand}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border" style="font-weight: 500;">
                            ${catName}
                        </span>
                    </td>
                    <td>
                        ${product.stock === 0 ? '<span class="badge bg-danger">Agotado</span>' : (product.stock > 0 && product.stock <= 5) ? `<span class="badge text-dark" style="background-color: #ffc107;">Bajo Stock: ${product.stock}</span>` : `<span class="badge bg-light text-dark border">${product.stock != null ? product.stock : '—'}</span>`}
                    </td>
                    <td><span class="price-tag">$${parseFloat(product.price).toFixed(2)}</span></td>
                    <td class="text-end">
                        <button class="btn-action me-1" onclick="openEditProductModal('${product.id}')" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    };

    window.renderAdminPackages = () => {
        const grid = document.getElementById('adminPackagesGrid');
        if (!grid) return;

        const allItems = getProducts() || [];
        const packages = allItems.filter(p => p.category === 'paquetes');

        grid.innerHTML = '';

        if (packages.length === 0) {
            grid.innerHTML = '<div class="col-12"><div class="text-center text-muted py-5 glass-card">No hay paquetes creados aún. ¡Crea tu primer combo!</div></div>';
            return;
        }

        packages.forEach(pkg => {
            let mediaHtml = pkg.image ?
                `<img src="${pkg.image}" class="w-100 h-100 object-fit-cover">` :
                `<i class="bi bi-gift text-danger" style="font-size: 3rem;"></i>`;

            // Show included products (supports [{id,qty}] and legacy string[])
            let includedHtml = '';
            if (pkg.includedProducts && pkg.includedProducts.length > 0) {
                const items = pkg.includedProducts.map(item => {
                    const pid = typeof item === 'string' ? item : item.id;
                    const qty = typeof item === 'string' ? 1 : (item.qty || 1);
                    const found = allItems.find(p => p.id === pid);
                    return { name: found ? found.name : pid, qty };
                });
                const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
                includedHtml = `<div class="mt-2"><small class="text-muted">${totalItems} producto(s):</small><br>
                ${items.map(i => `<span class="badge bg-light text-dark border me-1 mb-1" style="font-size:0.7rem;">${i.qty > 1 ? i.qty + 'x ' : ''}${i.name}</span>`).join('')}
            </div>`;
            }

            // Calculate savings
            let savingsHtml = '';
            if (pkg.oldPrice && pkg.oldPrice > pkg.price) {
                const savings = pkg.oldPrice - pkg.price;
                savingsHtml = `<div class="mt-1"><small class="text-decoration-line-through text-muted">$${pkg.oldPrice.toFixed(2)}</small> <span class="badge bg-success">Ahorro $${savings.toFixed(2)}</span></div>`;
            }

            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4';
            card.innerHTML = `
            <div class="admin-item-card position-relative overflow-hidden p-0 h-100 d-flex flex-column">
                <div style="height: 140px; background: #f0f2f5; display:flex; align-items:center; justify-content:center; border-radius: 16px 16px 0 0; overflow: hidden;">
                    ${mediaHtml}
                </div>
                <div class="p-3 d-flex flex-column flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="fw-bold mb-0">${pkg.name}</h5>
                        <span class="badge bg-danger">Combo</span>
                    </div>
                    <p class="text-muted small mb-2 flex-grow-1">${pkg.description || 'Sin descripción'}</p>
                    ${includedHtml}
                    <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top" style="border-color: #dee2e6 !important;">
                        <div>
                            <span class="price-tag fs-5">$${parseFloat(pkg.price).toFixed(2)}</span>
                            ${savingsHtml}
                        </div>
                        <button class="btn btn-admin-primary btn-sm" onclick="openEditPackageModal('${pkg.id}')">
                            <i class="bi bi-pencil-square me-1"></i> Editar
                        </button>
                    </div>
                </div>
            </div>
        `;
            grid.appendChild(card);
        });
    };

    window.updateCategoryDropdowns = () => {
        const select = document.getElementById('editCategory');
        if (!select) return;

        const categories = window.appCategories || [];
        select.innerHTML = '';

        categories.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });

        // Add hardcoded options for system level groupings if needed
        const packagesOpt = document.createElement('option');
        packagesOpt.value = 'paquetes';
        packagesOpt.textContent = '📦 PAQUETES / COMBOS';
        packagesOpt.className = 'text-danger fw-bold';
        select.appendChild(packagesOpt);
    };


    // --- BADGE SELECTOR LOGIC ---
    window.selectBadge = (btn, value) => {
        // Remove selected state from all badge buttons
        document.querySelectorAll('#badgeSelector .badge-option').forEach(b => {
            b.classList.remove('badge-selected');
        });
        // Mark clicked as selected
        btn.classList.add('badge-selected');
        // Set the promo input
        document.getElementById('editPromo').value = value;
    };

    window.syncBadgeButtons = (value) => {
        const buttons = document.querySelectorAll('#badgeSelector .badge-option');
        buttons.forEach(b => b.classList.remove('badge-selected'));
        // Try to find a matching preset
        const match = Array.from(buttons).find(b => b.dataset.badge === value);
        if (match) {
            match.classList.add('badge-selected');
        } else if (!value) {
            // Select "Sin Etiqueta"
            const noLabel = Array.from(buttons).find(b => b.dataset.badge === '');
            if (noLabel) noLabel.classList.add('badge-selected');
        }
        // If custom text doesn't match any preset, no button is selected (which is fine)
    };

    // --- PRODUCT/PACKAGE MODAL HANDLers ---

    window.openAddProductModal = () => {
        isEditingProduct = false;
        document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
        document.getElementById('btnDeleteProduct').style.display = 'none';

        resetProductForm();
        // Default category first available or a fallback
        const catSelect = document.getElementById('editCategory');
        if (catSelect.options.length > 0 && catSelect.options[0].value !== 'paquetes') {
            catSelect.value = catSelect.options[0].value;
        }

        document.getElementById('editIsPackage').value = 'false';
        productModal.show();
    };

    window.openAddPackageModal = () => {
        isEditingProduct = false;
        document.getElementById('productModalTitle').innerHTML = '<i class="bi bi-gift me-2 text-danger"></i>Nuevo Paquete';
        document.getElementById('btnDeleteProduct').style.display = 'none';

        resetProductForm();
        document.getElementById('editCategory').value = 'paquetes';
        document.getElementById('editIsPackage').value = 'true';

        // Visual tweaks for package
        document.getElementById('editImageIcon').value = 'bi-gift';
        document.getElementById('editImageColor').value = 'modelorama-rojo';

        // Show product selector
        showPackageProductSelector();

        productModal.show();
    };

    window.openEditProductModal = (id) => {
        loadProductIntoForm(id, 'Editar Producto', false);
    };

    window.openEditPackageModal = (id) => {
        loadProductIntoForm(id, '<i class="bi bi-gift me-2 text-danger"></i>Editar Paquete', true);
    };

    function loadProductIntoForm(id, titleHtml, isPackage) {
        const products = getProducts() || [];
        const product = products.find(p => p.id === id);
        if (!product) return;

        isEditingProduct = true;
        document.getElementById('productModalTitle').innerHTML = titleHtml;
        document.getElementById('btnDeleteProduct').style.display = 'block';

        document.getElementById('editId').value = product.id;
        document.getElementById('editIsPackage').value = isPackage ? 'true' : 'false';
        document.getElementById('editName').value = product.name || '';
        document.getElementById('editBrand').value = product.brand || '';
        document.getElementById('editCategory').value = product.category || (isPackage ? 'paquetes' : 'corona');
        document.getElementById('editPrice').value = product.price || '';
        document.getElementById('editStock').value = product.stock !== undefined ? product.stock : '';
        document.getElementById('editVolumeQty').value = product.volumeQty || '';
        document.getElementById('editVolumePrice').value = product.volumePrice || '';
        document.getElementById('editDesc').value = product.description || '';
        document.getElementById('editPromo').value = product.promo || '';
        syncBadgeButtons(product.promo || '');
        document.getElementById('editCold').checked = !!product.cold;
        document.getElementById('editActive').checked = product.active !== false;

        // Ensure element exists before setting it, since it's only in product modal
        const elFeatured = document.getElementById('editIsFeatured');
        if (elFeatured) elFeatured.checked = !!product.isFeatured;

        document.getElementById('editImageIcon').value = product.imageIcon || 'bi-box';
        document.getElementById('editImageColor').value = product.imageColor || 'modelorama-azul';
        if (typeof updateIconPreview === 'function') updateIconPreview();

        // Offers logic
        if (product.oldPrice) {
            document.getElementById('editHasOffer').checked = true;
            document.getElementById('oldPriceContainer').style.display = 'block';
            document.getElementById('editOldPrice').value = product.oldPrice;
        } else {
            document.getElementById('editHasOffer').checked = false;
            document.getElementById('oldPriceContainer').style.display = 'none';
            document.getElementById('editOldPrice').value = '';
        }

        // Image logic
        document.getElementById('editImage').value = product.image || '';
        document.getElementById('editImageFile').value = '';
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        if (product.image) {
            preview.src = product.image;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            preview.style.display = 'none';
            placeholder.style.display = 'block';
        }

        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadStatus').textContent = '';

        // Package specific logic (enforce strict [{id,qty}] schema)
        if (isPackage) {
            const items = product.includedProducts || [];
            showPackageProductSelector(items);
        } else {
            const selector = document.getElementById('packageProductSelector');
            if (selector) selector.style.display = 'none';
        }

        productModal.show();
    }


    // ===== PACKAGE PRODUCT SELECTOR =====
    function showPackageProductSelector(selectedItems = []) {
        const selector = document.getElementById('packageProductSelector');
        const list = document.getElementById('packageProductList');
        if (!selector || !list) return;

        selector.style.display = 'block';

        const normalizedItems = selectedItems || [];

        const allItems = typeof getProducts === 'function' ? (getProducts() || []) : [];
        const products = allItems.filter(p => p.category !== 'paquetes');

        if (products.length === 0) {
            list.innerHTML = '<p class="text-muted small mb-0">No hay productos disponibles.</p>';
            return;
        }

        list.innerHTML = products.map(p => {
            const existing = normalizedItems.find(item => item.id === p.id);
            const qty = existing ? existing.qty : 0;
            return `
                <div class="d-flex align-items-center gap-2 py-2 border-bottom pkg-item-row" data-name="${p.name.toLowerCase()}" style="border-color: #f0f2f5 !important;">
                    <input type="number" min="0" max="99" value="${qty}" data-product-id="${p.id}"
                        class="form-control form-control-sm text-center fw-bold pkg-qty-input"
                        style="width: 58px; flex-shrink: 0;" oninput="updatePackageSavings()">
                    <div class="d-flex align-items-center gap-2 flex-grow-1">
                        ${p.image ? `<img src="${p.image}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;">` : `<i class="bi ${p.imageIcon || 'bi-box'} text-muted"></i>`}
                        <span class="flex-grow-1">${p.name}</span>
                        <span class="badge bg-light text-success border fw-bold">$${parseFloat(p.price).toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Listen for price changes to recalculate savings
        const priceInput = document.getElementById('editPrice');
        priceInput.removeEventListener('input', updatePackageSavings);
        priceInput.addEventListener('input', updatePackageSavings);

        updatePackageSavings();
    }

    // Filter package products
    window.filterPackageProducts = () => {
        const input = document.getElementById('packageProductSearch');
        if (!input) return;
        const filter = input.value.toLowerCase();
        const items = document.querySelectorAll('#packageProductList .pkg-item-row');

        items.forEach(item => {
            const name = item.getAttribute('data-name') || '';
            if (name.includes(filter)) {
                item.style.setProperty('display', 'flex', 'important');
            } else {
                item.style.setProperty('display', 'none', 'important');
            }
        });
    };

    window.updatePackageSavings = () => {
        const qtyInputs = document.querySelectorAll('#packageProductList .pkg-qty-input');
        const allItems = typeof getProducts === 'function' ? (getProducts() || []) : [];
        let individualTotal = 0;

        qtyInputs.forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (qty > 0) {
                const prod = allItems.find(p => p.id === input.dataset.productId);
                if (prod) individualTotal += (parseFloat(prod.price) || 0) * qty;
            }
        });

        const comboPrice = parseFloat(document.getElementById('editPrice').value) || 0;
        const savings = individualTotal - comboPrice;

        const totalEl = document.getElementById('packageIndividualTotal');
        const savingsEl = document.getElementById('packageSavings');

        if (totalEl) totalEl.textContent = `$${individualTotal.toFixed(2)}`;
        if (savingsEl) {
            savingsEl.textContent = savings > 0 ? `$${savings.toFixed(2)}` : '$0.00';
            savingsEl.parentElement.className = savings > 0 ? 'text-success fw-bold' : 'text-muted fw-bold';
        }
    };

    function resetProductForm() {
        document.getElementById('editId').value = '';
        document.getElementById('editName').value = '';
        document.getElementById('editBrand').value = '';
        document.getElementById('editPrice').value = '';
        document.getElementById('editStock').value = '';
        document.getElementById('editVolumeQty').value = '';
        document.getElementById('editVolumePrice').value = '';
        document.getElementById('editDesc').value = '';
        document.getElementById('editPromo').value = '';
        syncBadgeButtons('');
        document.getElementById('editCold').checked = true;
        document.getElementById('editImageIcon').value = 'bi-cup-straw';
        document.getElementById('editImageColor').value = 'modelorama-azul';
        if (typeof updateIconPreview === 'function') updateIconPreview();

        document.getElementById('editHasOffer').checked = false;
        document.getElementById('oldPriceContainer').style.display = 'none';
        document.getElementById('editOldPrice').value = '';
        document.getElementById('editActive').checked = true;

        const elFeatured = document.getElementById('editIsFeatured');
        if (elFeatured) elFeatured.checked = false;

        document.getElementById('editImage').value = '';
        document.getElementById('editImageFile').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('imagePreview').src = '';
        document.getElementById('imagePlaceholder').style.display = 'block';

        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadStatus').textContent = '';

        // Hide package selector by default
        const selector = document.getElementById('packageProductSelector');
        if (selector) selector.style.display = 'none';
    }

    window.saveProduct = () => {
        const id = document.getElementById('editId').value;
        const name = document.getElementById('editName').value;
        const brand = document.getElementById('editBrand').value;
        const isPackage = document.getElementById('editIsPackage').value === 'true';
        let category = document.getElementById('editCategory').value;
        if (isPackage) {
            category = 'paquetes';
        }
        const price = parseFloat(document.getElementById('editPrice').value);

        const stockInput = document.getElementById('editStock').value;
        const stock = stockInput ? parseInt(stockInput) : null;

        // Volume pricing
        const vQtyStr = document.getElementById('editVolumeQty').value;
        const vPriceStr = document.getElementById('editVolumePrice').value;
        const volumeQty = vQtyStr ? parseInt(vQtyStr) : null;
        const volumePrice = vPriceStr ? parseFloat(vPriceStr) : null;

        const description = document.getElementById('editDesc').value;
        const image = document.getElementById('editImage').value;
        const promo = document.getElementById('editPromo').value;
        const cold = document.getElementById('editCold').checked;
        const active = document.getElementById('editActive').checked;
        const elFeatured = document.getElementById('editIsFeatured');
        const isFeatured = elFeatured ? elFeatured.checked : false;

        const imageIcon = document.getElementById('editImageIcon').value;
        const imageColor = document.getElementById('editImageColor').value;

        const hasOffer = document.getElementById('editHasOffer').checked;
        let oldPrice = hasOffer ? parseFloat(document.getElementById('editOldPrice').value) : null;

        // Validate: oldPrice must be higher than price (it's the "before" price)
        if (hasOffer && oldPrice && !isNaN(oldPrice) && oldPrice <= price) {
            // Auto-swap: put the higher value as oldPrice
            const temp = oldPrice;
            oldPrice = price;
            document.getElementById('editPrice').value = temp;
        }

        // Collect included products for packages [{id, qty}]
        let includedProducts = [];
        if (isPackage) {
            const qtyInputs = document.querySelectorAll('#packageProductList .pkg-qty-input');
            qtyInputs.forEach(input => {
                const qty = parseInt(input.value) || 0;
                if (qty > 0) {
                    includedProducts.push({ id: input.dataset.productId, qty });
                }
            });
        }

        if (!name || isNaN(price)) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'El nombre y el precio son obligatorios.'
            });
            return;
        }

        const productData = {
            name,
            brand,
            category,
            price,
            stock,
            volumeQty: (volumeQty > 0 && volumePrice > 0) ? volumeQty : null,
            volumePrice: (volumeQty > 0 && volumePrice > 0) ? volumePrice : null,
            description,
            image,
            promo: promo || null,
            oldPrice: oldPrice && !isNaN(oldPrice) ? oldPrice : null,
            cold,
            active,
            isFeatured,
            imageIcon,
            imageColor,
            includedProducts: isPackage ? includedProducts : null
        };

        if (isEditingProduct && id) {
            // Delete old image if it was replaced
            const allProducts = typeof getProducts === 'function' ? (getProducts() || []) : [];
            const oldProduct = allProducts.find(p => p.id === id);
            if (oldProduct && oldProduct.image && oldProduct.image !== image) {
                if (typeof deleteImageFromStorage === 'function') {
                    deleteImageFromStorage(oldProduct.image);
                }
            }

            updateProduct(id, productData);
            Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Cambios guardados correctamente.',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            const newId = (category === 'paquetes' ? 'pkg-' : '') + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
            addProduct({ id: newId, ...productData });
            Swal.fire({
                icon: 'success',
                title: 'Agregado',
                text: 'Creado correctamente.',
                timer: 1500,
                showConfirmButton: false
            });
        }

        productModal.hide();
    };

    window.handleDeleteProduct = () => {
        const id = document.getElementById('editId').value;
        if (!id) return;

        Swal.fire({
            title: '¿Eliminar?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteProduct(id);
                productModal.hide();
                Swal.fire('Eliminado', '', 'success');
            }
        });
    };


    /* =========================================
       2. CATEGORIES LOGIC
       ========================================= */

    window.renderAdminCategories = () => {
        const tableBody = document.getElementById('adminCategoryTable');
        if (!tableBody) return;

        const categories = window.appCategories || [];
        tableBody.innerHTML = '';

        if (categories.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay categorías dinámicas.</td></tr>';
            return;
        }

        // Sort by order
        const sortedCats = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

        sortedCats.forEach(cat => {
            // Replicate the Story Ring look for the table
            let innerContent = '';
            if (cat.type === 'image' && cat.icon) {
                innerContent = `<img src="${cat.icon}" style="width: 20px; object-fit: contain;">`;
            } else {
                innerContent = `<i class="bi ${cat.icon || 'bi-tag'}"></i>`;
            }

            const ringHtml = `
                <div class="story-item" style="width: auto; min-width: 0; margin-right: 0;">
                    <div class="story-ring ${cat.ringColor || ''}" style="width: 45px; height: 45px; padding: 2px;">
                        <div class="story-circle" style="background: rgba(0,0,0,0.5);">
                            ${innerContent}
                        </div>
                    </div>
                </div>
            `;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ringHtml}</td>
                <td>
                    <div class="fw-bold text-light">${cat.name}</div>
                    <code class="text-muted small">${cat.id}</code>
                </td>
                <td class="text-muted">${cat.order || 0}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info border-0" onclick="openEditCategoryModal('${cat.id}')">
                        <i class="bi bi-pencil-square fs-5"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    window.openAddCategoryModal = () => {
        isEditingCategory = false;
        document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
        document.getElementById('btnDeleteCategory').style.display = 'none';

        document.getElementById('editCatOldId').value = '';
        document.getElementById('editCatId').value = '';
        document.getElementById('editCatId').readOnly = false; // can edit ID on new

        document.getElementById('editCatName').value = '';
        document.getElementById('editCatType').value = 'icon';
        document.getElementById('editCatOrder').value = '10';
        document.getElementById('editCatIcon').value = 'bi-tag text-white';
        document.getElementById('editCatImage').value = '';
        document.getElementById('editCatRing').value = '';

        toggleCategoryType();
        categoryModal.show();
    };

    window.openEditCategoryModal = (id) => {
        const categories = window.appCategories || [];
        const cat = categories.find(c => c.id === id);
        if (!cat) return;

        isEditingCategory = true;
        document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
        document.getElementById('btnDeleteCategory').style.display = 'block';

        document.getElementById('editCatOldId').value = cat.id;
        document.getElementById('editCatId').value = cat.id;
        document.getElementById('editCatId').readOnly = true; // prevent changing ID of existing to avoid orphan products

        document.getElementById('editCatName').value = cat.name;
        document.getElementById('editCatType').value = cat.type || 'icon';
        document.getElementById('editCatOrder').value = cat.order || 0;

        if (cat.type === 'image') {
            document.getElementById('editCatImage').value = cat.icon || '';
            document.getElementById('editCatIcon').value = '';
        } else {
            document.getElementById('editCatIcon').value = cat.icon || '';
            document.getElementById('editCatImage').value = '';
        }

        document.getElementById('editCatRing').value = cat.ringColor || '';

        toggleCategoryType();
        categoryModal.show();
    };

    window.toggleCategoryType = () => {
        const type = document.getElementById('editCatType').value;
        if (type === 'icon') {
            document.getElementById('catIconInputGroup').style.display = 'block';
            document.getElementById('catImageInputGroup').style.display = 'none';
        } else {
            document.getElementById('catIconInputGroup').style.display = 'none';
            document.getElementById('catImageInputGroup').style.display = 'block';
        }
    };

    window.saveCategory = () => {
        let id = document.getElementById('editCatId').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const oldId = document.getElementById('editCatOldId').value;
        const name = document.getElementById('editCatName').value.trim();
        const type = document.getElementById('editCatType').value;
        const order = parseInt(document.getElementById('editCatOrder').value) || 0;
        const ringColor = document.getElementById('editCatRing').value;

        const icon = type === 'image' ? document.getElementById('editCatImage').value.trim() : document.getElementById('editCatIcon').value.trim();

        if (!id || !name) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'El ID y el Nombre son obligatorios.' });
            return;
        }

        const catData = { name, type, icon, order, ringColor };

        if (isEditingCategory && oldId) {
            // Delete old image if it was replaced
            const categories = window.appCategories || [];
            const oldCat = categories.find(c => c.id === oldId);
            if (oldCat && oldCat.type === 'image' && oldCat.icon && oldCat.icon !== icon) {
                if (typeof deleteImageFromStorage === 'function') {
                    deleteImageFromStorage(oldCat.icon);
                }
            }

            // We disabled ID editing, so oldId should be same as id, but just in case
            updateCategory(oldId, catData);
            Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1000, showConfirmButton: false });
        } else {
            // Check if ID exists
            const existing = (window.appCategories || []).find(c => c.id === id);
            if (existing) {
                Swal.fire({ icon: 'error', title: 'ID en uso', text: 'Ese ID de categoría ya existe.' });
                return;
            }
            addCategory({ id, ...catData });
            Swal.fire({ icon: 'success', title: 'Categoría Creada', timer: 1000, showConfirmButton: false });
        }

        categoryModal.hide();
    };

    window.handleDeleteCategory = () => {
        const id = document.getElementById('editCatOldId').value;
        if (!id) return;

        Swal.fire({
            title: '¿Eliminar Categoría?',
            text: "Los productos asociados no se borrarán, pero podrían no mostrarse correctamente si no actualizas su categoría.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteCategory(id);
                categoryModal.hide();
                Swal.fire('Eliminada', '', 'success');
            }
        });
    };


    /* =========================================
       3. IMAGE UPLOAD LOGIC (FIREBASE STORAGE)
       ========================================= */

    window.uploadImage = async () => {
        const fileInput = document.getElementById('editImageFile');
        const file = fileInput.files[0];
        if (!file) return;

        const progressBar = document.querySelector('#uploadProgress .progress-bar');
        const progressContainer = document.getElementById('uploadProgress');
        const statusText = document.getElementById('uploadStatus');
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        const urlInput = document.getElementById('editImage');

        progressContainer.style.display = 'flex';
        statusText.style.display = 'block';
        statusText.textContent = 'Subiendo a Firebase...';
        statusText.className = 'text-gold mt-1 d-block small';
        progressBar.style.width = '0%';

        try {
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const storageRef = storage.ref(`products/${fileName}`);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressBar.style.width = progress + '%';
                },
                (error) => {
                    console.error("Upload failed", error);
                    statusText.textContent = 'Error al subir.';
                    statusText.className = 'text-danger mt-1 d-block small';
                    progressContainer.style.display = 'none';
                },
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                    // Update UI
                    urlInput.value = downloadURL;
                    preview.src = downloadURL;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';

                    statusText.textContent = '¡Imagen guardada!';
                    statusText.className = 'text-success mt-1 d-block small';

                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                        statusText.textContent = '';
                    }, 2000);
                }
            );
        } catch (error) {
            console.error("Firebase Storage Error", error);
            statusText.textContent = 'Error de conexión.';
        }
    };


    // ===== AUTHENTICATION =====
    window.logout = () => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        } else {
            window.location.href = 'index.html';
        }
    };

    // ===== ICON PREVIEW =====
    const MODELORAMA_COLORS = {
        'modelorama-azul': '#092440',
        'modelorama-gold': '#FFC92C',
        'modelorama-rojo': '#C62828',
        'modelorama-amber': '#FF8F00',
        'modelorama-cyan': '#0288D1',
        'modelorama-dark': '#1B2838',
        'modelorama-verde': '#2E7D32',
        // Legacy fallbacks
        'text-gold': '#FFC92C',
        'text-secondary': '#6c757d',
        'text-warning': '#ffc107',
        'text-danger': '#dc3545',
        'text-info': '#0dcaf0',
        'text-primary': '#0d6efd',
        'text-dark': '#212529',
        'text-success': '#198754',
        'text-white': '#f8f9fa'
    };

    window.updateIconPreview = () => {
        const iconVal = document.getElementById('editImageIcon').value;
        const colorVal = document.getElementById('editImageColor').value;
        const previewBox = document.getElementById('iconPreviewBox');
        if (!previewBox) return;
        const hex = MODELORAMA_COLORS[colorVal] || '#092440';
        previewBox.innerHTML = `<i class="bi ${iconVal}" style="color: ${hex};"></i>`;
    };

    // ===== CROSS-SELL RULES MANAGEMENT =====

    window.openCrossSellForm = (rule = null) => {
        const form = document.getElementById('crossSellForm');
        if (!form) return;

        // Populate category dropdown
        const catSelect = document.getElementById('csTriggerCategory');
        const categories = window.appCategories || [];
        catSelect.innerHTML = categories
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(c => `<option value="${c.id}">${c.name}</option>`)
            .join('');

        // Populate product dropdown
        const prodSelect = document.getElementById('csSuggestProduct');
        const allProducts = typeof getProducts === 'function' ? (getProducts() || []) : [];
        prodSelect.innerHTML = allProducts
            .filter(p => p.category !== 'paquetes')
            .map(p => `<option value="${p.id}">${p.name} — $${parseFloat(p.price).toFixed(2)}</option>`)
            .join('');

        // Fill form if editing
        document.getElementById('csRuleId').value = rule ? rule.id : '';
        if (rule) {
            catSelect.value = rule.triggerCategory;
            prodSelect.value = rule.suggestProductId;
            document.getElementById('csCustomMessage').value = rule.customMessage || '';
        } else {
            document.getElementById('csCustomMessage').value = '';
        }

        form.style.display = 'block';
    };

    window.closeCrossSellForm = () => {
        const form = document.getElementById('crossSellForm');
        if (form) form.style.display = 'none';
    };

    window.saveCrossSellRule = () => {
        const ruleId = document.getElementById('csRuleId').value;
        const triggerCategory = document.getElementById('csTriggerCategory').value;
        const suggestProductId = document.getElementById('csSuggestProduct').value;
        const customMessage = document.getElementById('csCustomMessage').value.trim();

        if (!triggerCategory || !suggestProductId) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Selecciona una categoría y un producto.' });
            return;
        }

        const data = { triggerCategory, suggestProductId, customMessage };

        if (ruleId) {
            db.collection('crossSellRules').doc(ruleId).update(data).then(() => {
                Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1200, showConfirmButton: false });
                closeCrossSellForm();
            });
        } else {
            db.collection('crossSellRules').add(data).then(() => {
                Swal.fire({ icon: 'success', title: 'Regla creada', timer: 1200, showConfirmButton: false });
                closeCrossSellForm();
            });
        }
    };

    window.deleteCrossSellRule = (ruleId) => {
        Swal.fire({
            title: '¿Eliminar regla?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                db.collection('crossSellRules').doc(ruleId).delete().then(() => {
                    Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1000, showConfirmButton: false });
                });
            }
        });
    };

    window.editCrossSellRule = (ruleId) => {
        const rules = window.crossSellRules || [];
        const rule = rules.find(r => r.id === ruleId);
        if (rule) openCrossSellForm(rule);
    };

    window.renderCrossSellRules = () => {
        const tableBody = document.getElementById('crossSellRulesTable');
        if (!tableBody) return;

        const rules = window.crossSellRules || [];
        const categories = window.appCategories || [];
        const allProducts = typeof getProducts === 'function' ? (getProducts() || []) : [];

        if (rules.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No hay reglas de venta cruzada configuradas.</td></tr>';
            return;
        }

        tableBody.innerHTML = rules.map(rule => {
            const catName = categories.find(c => c.id === rule.triggerCategory)?.name || rule.triggerCategory;
            const prod = allProducts.find(p => p.id === rule.suggestProductId);
            const prodName = prod ? prod.name : rule.suggestProductId;
            return `
                <tr>
                    <td><span class="badge bg-light text-dark border">${catName}</span></td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            ${prod && prod.image ? `<img src="${prod.image}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;">` : ''}
                            <span class="small">${prodName}</span>
                        </div>
                    </td>
                    <td><span class="small text-muted">${rule.customMessage || '—'}</span></td>
                    <td class="text-end">
                        <button class="btn-action me-1" onclick="editCrossSellRule('${rule.id}')" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn-action text-danger" onclick="deleteCrossSellRule('${rule.id}')" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Listen for cross-sell rules updates
    window.addEventListener('crossSellRulesUpdated', () => {
        renderCrossSellRules();
    });

    // ===== IMAGE GALLERY LOGIC =====
    window.openImageGallery = (targetInputId) => {
        const galleryModal = new bootstrap.Modal(document.getElementById('imageGalleryModal'));
        const grid = document.getElementById('imageGalleryGrid');

        // Temporarily store the target input ID so we know where to send the image later
        grid.dataset.targetInput = targetInputId;

        // Show loading state
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="text-muted mt-2">Recolectando imágenes...</p>
            </div>
        `;

        galleryModal.show();

        // Collect unique image URLs
        const imageUrls = new Set();

        const products = window.appProducts || [];
        products.forEach(p => {
            if (p.image && typeof p.image === 'string' && p.image.trim() !== '') {
                imageUrls.add(p.image);
            }
        });

        const categories = window.appCategories || [];
        categories.forEach(c => {
            if (c.image && typeof c.image === 'string' && c.image.trim() !== '') {
                imageUrls.add(c.image);
            }
        });

        const urlsArray = Array.from(imageUrls);

        if (urlsArray.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-images fs-1 text-muted opacity-50"></i>
                    <p class="text-muted mt-2">No se encontraron imágenes en la base de datos.</p>
                </div>
            `;
            return;
        }

        // Render gallery
        grid.innerHTML = urlsArray.map(url => `
            <div class="col-4 col-md-3 col-lg-2">
                <div class="card h-100 border-0 shadow-sm overflow-hidden" style="cursor: pointer; transition: transform 0.2s;" 
                     onclick="selectImageFromGallery('${url}')"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'">
                    <img src="${url}" class="card-img-top" style="height: 100px; object-fit: cover;" loading="lazy" alt="Gallery Image">
                </div>
            </div>
        `).join('');
    };

    window.selectImageFromGallery = (url) => {
        const grid = document.getElementById('imageGalleryGrid');
        const targetInputId = grid.dataset.targetInput;

        if (!targetInputId) return;

        // Set the input value
        const targetInput = document.getElementById(targetInputId);
        if (targetInput) {
            targetInput.value = url;

            // If it's the product image, update the preview wrapper UI
            if (targetInputId === 'editImage') {
                document.getElementById('imagePreview').src = url;
                document.getElementById('imagePreview').style.display = 'block';
                document.getElementById('imagePlaceholder').style.display = 'none';

                // Clear the file input since we selected from gallery
                document.getElementById('editImageFile').value = '';
                document.getElementById('uploadStatus').textContent = 'Imagen seleccionada de la galería.';
                document.getElementById('uploadStatus').className = 'text-success mt-1 small';
            }
            // If it's the category image, no extra preview wrapper to update currently, but value is set.
        }

        // Close the modal
        const galleryModalEl = document.getElementById('imageGalleryModal');
        const modalInstance = bootstrap.Modal.getInstance(galleryModalEl);
        if (modalInstance) {
            modalInstance.hide();
        }
    };

});
