/**
 * Modelorama Product Catalog
 * Shared data source for Main Site and Admin Panel
 * Uses Firebase Firestore for global sync
 */

const DEFAULT_PRODUCTS = [];

const DEFAULT_CATEGORIES = [];

window.appProducts = [];
window.appCategories = [];

// 1. Initialize Products and Categories from Firestore
function initData() {
    // Fetch Products
    db.collection('products').onSnapshot(snapshot => {
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        if (products.length === 0) {
            // Only seed if we haven't initialized before
            db.collection('settings').doc('init').get().then(initDoc => {
                if (!initDoc.exists || !initDoc.data().productsSeeded) {
                    seedDatabase('products', DEFAULT_PRODUCTS);
                    db.collection('settings').doc('init').set(
                        { productsSeeded: true },
                        { merge: true }
                    );
                } else {
                    // Already seeded before, user deleted everything — keep empty
                    window.appProducts = [];
                    window.dispatchEvent(new Event('productsUpdated'));
                }
            }).catch(() => {
                // On error, don't re-seed, just show empty
                window.appProducts = [];
                window.dispatchEvent(new Event('productsUpdated'));
            });
        } else {
            window.appProducts = products;
            window.dispatchEvent(new Event('productsUpdated'));
        }
    }, (error) => {
        console.error("Error fetching products: ", error);
    });

    // Fetch Categories
    db.collection('categories').orderBy('order').onSnapshot(snapshot => {
        const categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });

        if (categories.length === 0) {
            // Only seed if we haven't initialized before
            db.collection('settings').doc('init').get().then(initDoc => {
                if (!initDoc.exists || !initDoc.data().categoriesSeeded) {
                    seedDatabase('categories', DEFAULT_CATEGORIES);
                    db.collection('settings').doc('init').set(
                        { categoriesSeeded: true },
                        { merge: true }
                    );
                } else {
                    window.appCategories = [];
                    window.dispatchEvent(new Event('categoriesUpdated'));
                }
            }).catch(() => {
                window.appCategories = [];
                window.dispatchEvent(new Event('categoriesUpdated'));
            });
        } else {
            window.appCategories = categories;
            window.dispatchEvent(new Event('categoriesUpdated'));
        }
    }, (error) => {
        console.error("Error fetching categories: ", error);
    });
}

function seedDatabase(collectionName, dataArray) {
    console.log(`Seeding Firebase ${collectionName}...`);
    const batch = db.batch();
    dataArray.forEach(item => {
        const ref = db.collection(collectionName).doc(item.id);
        const { id, ...data } = item;
        batch.set(ref, data);
    });
    batch.commit().then(() => {
        console.log(`${collectionName} seeded successfully`);
    }).catch(err => {
        console.error(`Error seeding ${collectionName}:`, err);
    });
}

// 2. Start Listener
initData();

// 2b. Cross-Sell Rules Listener
window.crossSellRules = [];
db.collection('crossSellRules').onSnapshot(snapshot => {
    const rules = [];
    snapshot.forEach(doc => {
        rules.push({ id: doc.id, ...doc.data() });
    });
    if (rules.length === 0) {
        db.collection('settings').doc('init').get().then(initDoc => {
            if (!initDoc.exists || !initDoc.data().rulesSeeded) {
                seedDatabase('crossSellRules', []);
                db.collection('settings').doc('init').set({ rulesSeeded: true }, { merge: true });
            }
        }).catch(() => { });
    }

    window.crossSellRules = rules;
    window.dispatchEvent(new Event('crossSellRulesUpdated'));
}, (error) => {
    console.error("Error fetching crossSellRules: ", error);
});

// 3. Helper Functions for CRUD - Products
function getProducts() {
    return window.appProducts;
}

function addProduct(product) {
    const { id, ...data } = product;
    db.collection('products').doc(id).set(data);
}

function updateProduct(id, updates) {
    db.collection('products').doc(id).update(updates);
}

function deleteProduct(id) {
    db.collection('products').doc(id).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.image) {
                deleteImageFromStorage(data.image);
            }
            db.collection('products').doc(id).delete();
        }
    }).catch((error) => {
        console.error("Error fetching product before deletion:", error);
    });
}

// 4. Utility: Delete Image from Storage
function deleteImageFromStorage(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') return;

    // Check if it is a Firebase Storage URL
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
            console.log("Attempting to delete orphaned image from storage:", imageUrl);
            const imageRef = firebase.storage().refFromURL(imageUrl);
            imageRef.delete().then(() => {
                console.log("Image successfully deleted from storage.");
            }).catch((error) => {
                console.error("Error deleting image from storage (might not exist):", error);
            });
        } catch (error) {
            console.error("Error parsing storage URL:", error);
        }
    }
}

// 5. Category Management (Firestore)
function addCategory(cat) {
    db.collection('categories').doc(cat.id).set(cat)
        .then(() => {
            console.log("Category added to Firestore");
            // Local update will happen via onSnapshot
        })
        .catch((error) => {
            console.error("Error adding category: ", error);
        });
}

function updateCategory(id, updates) {
    db.collection('categories').doc(id).update(updates)
        .then(() => {
            console.log("Category updated in Firestore");
        })
        .catch((error) => {
            console.error("Error updating category: ", error);
        });
}

function deleteCategory(id) {
    db.collection('categories').doc(id).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.image) {
                deleteImageFromStorage(data.image);
            }
            db.collection('categories').doc(id).delete()
                .then(() => {
                    console.log("Category deleted from Firestore");
                })
                .catch((error) => {
                    console.error("Error deleting category: ", error);
                });
        }
    }).catch((error) => {
        console.error("Error fetching category before deletion:", error);
    });
}

// Deprecated LocalStorage listeners (kept for cleanup if needed)
// window.addEventListener('storage', ...);
