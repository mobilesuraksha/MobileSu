// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAnVeraKeZzPI7sGhMJYt5h5nN1p0Jip6g",
    authDomain: "cyber-b4a39.firebaseapp.com",
    projectId: "cyber-b4a39",
    storageBucket: "cyber-b4a39.firebasestorage.app",
    messagingSenderId: "211867483565",
    appId: "1:211867483565:web:0e9fe26b3a09c783c4b524",
    measurementId: "G-0H4VGPWB12"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support all of the features required to enable persistence');
        }
    });

// Export for use in other scripts
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
