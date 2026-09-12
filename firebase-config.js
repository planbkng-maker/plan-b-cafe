/* ================================================================
   PLAN B — تنظیمات Firebase
   ================================================================
   طبق راهنمای فایل README-راهنما.md یک پروژه‌ی رایگان Firebase بساز
   و مقادیر زیر را از بخش «Project settings» با کدهای خودت جایگزین کن.
   این تنها فایلی است که برای وصل‌شدن سایت به دیتابیس واقعی باید
   ویرایش کنی؛ بقیه‌ی فایل‌ها را دست نزن.
================================================================ */
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
