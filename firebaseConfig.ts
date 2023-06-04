// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCy-9bWZ8kyfH17GN4FRzmbgOSy408kBCY",
  authDomain: "medication-reminder-1a067.firebaseapp.com",
  projectId: "medication-reminder-1a067",
  storageBucket: "medication-reminder-1a067.appspot.com",
  messagingSenderId: "106738863432",
  appId: "1:106738863432:web:7f520cb3e9fc29bcfdf77d",
  measurementId: "G-ZQS39P5XL6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);