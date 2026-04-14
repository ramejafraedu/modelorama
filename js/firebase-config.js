const firebaseConfig = {
    apiKey: "AIzaSyBAvp7YgAbrq2ASU5JfuQ_IfpQwBqjYxbQ",
    authDomain: "modelorama-app-2026.firebaseapp.com",
    projectId: "modelorama-app-2026",
    storageBucket: "modelorama-app-2026.firebasestorage.app",
    messagingSenderId: "940750867033",
    appId: "1:940750867033:web:de81d809ede8e6e1a57f48"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Habilitar persistencia offline para que los datos sobrevivan recargas
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistencia: múltiples pestañas abiertas, solo una puede habilitarla.');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistencia: no soportada en este navegador.');
        }
    });
