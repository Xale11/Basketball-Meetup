// firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDPs-WTfW_y23_o0UvGzktTLk2tg6eOj_8",
  authDomain: "basketball-meetup-fd5a6.firebaseapp.com",
  projectId: "basketball-meetup-fd5a6",
  storageBucket: "basketball-meetup-fd5a6.firebasestorage.app",
  messagingSenderId: "327089960623",
  appId: "1:327089960623:web:263500948ec99b67e2c65a",
  measurementId: "G-TBY1V744B3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services you need
const auth = getAuth(app);
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });
const db = getFirestore(app);

export { app, auth, db };