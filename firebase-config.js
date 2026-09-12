const firebaseConfig = {
  apiKey: "AIzaSyB0xmRi3TZtEJhqMoB1Z8ZxtwxuslN9__U",
  authDomain: "plan-b-cafe-menu.firebaseapp.com",
  projectId: "plan-b-cafe-menu",
  storageBucket: "plan-b-cafe-menu.firebasestorage.app",
  messagingSenderId: "48339328025",
  appId: "1:48339328025:web:6e7c9af17e65fd7f291e88"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
