import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage"; 
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDKnZSHjbpfKnj3Mn67bsQg6kXIjhQM7yY",
  authDomain: "elotesbanus.firebaseapp.com",
  projectId: "elotesbanus",
  storageBucket: "elotesbanus.appspot.com",
  messagingSenderId: "140009978068",
  appId: "1:140009978068:web:0675aadb8beab748032341"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const storage = getStorage(app); 

export { db, storage }; 

