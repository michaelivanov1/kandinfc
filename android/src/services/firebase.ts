// src/services/firebase.ts
import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// using firebase project config (from google-services.json)
const firebaseConfig = {
    apiKey: "AIzaSyAYtCaV-HBqn9bPLuq9FLPFY3T371ugS1k",
    authDomain: "kandinfc.firebaseapp.com",
    projectId: "kandinfc",
    storageBucket: "kandinfc.firebasestorage.app",
    messagingSenderId: "602788145762",
    appId: "1:602788145762:android:8fe9575d8aee675a48bf3b",
};


// initialize firebase app
export const firebaseApp = initializeApp(firebaseConfig);

// export firebase auth to use in screens
export const firebaseAuth = auth();