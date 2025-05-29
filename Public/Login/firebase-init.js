const firebaseConfig = {
    apiKey: "AIzaSyALm01oDooHTXgAQCc-ARLMMA9k5wNbv4I",
    authDomain: "proyectois2025-50ffc.firebaseapp.com",
    projectId: "proyectois2025-50ffc",
    storageBucket: "proyectois2025-50ffc.firebasestorage.app",
    messagingSenderId: "1064338863726",
    appId: "1:1064338863726:web:a9902af09d45b7a0c0d87f"
  };
  
  firebase.initializeApp(firebaseConfig);
  
  function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' }); 
  
    firebase.auth().signInWithPopup(provider)
      .then(result => {
        const user = result.user;
        alert("Bienvenido, " + user.displayName);
      })
      .catch(error => {
        console.error(error);
        alert("Error al iniciar sesión: " + error.message);
      });
  }