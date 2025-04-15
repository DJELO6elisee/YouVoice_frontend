<template>
  <div class="login-container">
    <div class="form-section">
      <div class="form-content">
        <h1>BIENVENUE</h1>
        <p class="subtitle">Connectez-vous à YOUVOICE</p>

        <button class="google-btn" disabled> <!-- Désactivé pour l'instant -->
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo" width="20" height="20">
          Continue With Google
        </button>

        <div class="separator">
          <span>Ou</span>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="formData.email" placeholder="Entrez votre email" required>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input type="password" id="password" v-model="formData.password" placeholder="Entrez votre mot de passe" required>
          </div>

          <div class="form-group remember-me">
            <input type="checkbox" id="rememberMe" v-model="formData.rememberMe">
            <label for="rememberMe">Se souvenir de moi</label>
          </div>

          <!-- Message d'erreur affiché ici -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          <!-- Le message de succès est retiré car on redirige immédiatement -->
          <!-- <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div> -->

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? 'Connexion en cours...' : 'Se Connecter' }}
          </button>
        </form>

        <p class="login-link">
          Vous n'avez pas de compte ? <router-link to="/register">Créer un compte</router-link>
        </p>
      </div>
    </div>
    <div class="background-section"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios'; // Vous utilisez axios, c'est bien
import { useRouter } from 'vue-router';
// ===> IMPORTER LES DEUX TYPES DE HELPERS TOKEN <====
import { setAuthToken, removeAuthToken } from '@/utils/auth'; // Pour token utilisateur normal
import { setAdminAuthToken, removeAdminAuthToken } from '@/utils/adminAuth'; // Pour token admin

const router = useRouter();

const formData = ref({
  email: '',
  password: '',
  rememberMe: false // Non utilisé actuellement, mais gardé
});

const isLoading = ref(false);
const errorMessage = ref('');

// URL de base de l'API (votre configuration semble correcte)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app/api'; // Utiliser VITE_... est mieux

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  // Nettoyer les anciens tokens avant la tentative de connexion
  removeAuthToken();
  removeAdminAuthToken();
  // Nettoyer aussi l'userId si vous le stockez séparément
  localStorage.removeItem('userId');

  if (!formData.value.email || !formData.value.password) {
    errorMessage.value = 'Veuillez remplir tous les champs requis.';
    isLoading.value = false; // Arrêter le chargement
    return;
  }

  try {
    console.log(`[LoginView] Tentative de connexion pour ${formData.value.email}...`);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: formData.value.email,
      password: formData.value.password
    });

    console.log('[LoginView] Réponse API reçue:', response.data);

    // --- LOGIQUE MODIFIÉE ---
    // Vérifier si la réponse est un succès, contient un token ET un objet utilisateur
    if (response.data && response.data.success === true && response.data.token && response.data.user) {
      const token = response.data.token;
      const user = response.data.user; // Récupérer l'objet utilisateur de la réponse

      console.log('[LoginView] Connexion réussie. Token reçu. Vérification du statut Admin...');
      console.log('[LoginView] Données utilisateur reçues:', user);

      // Stocker l'ID utilisateur (bonne pratique)
       localStorage.setItem('userId', user.id);
       console.log(`[LoginView] User ID stocké: ${user.id}`);

      // Vérifier si l'utilisateur est un administrateur
      // IMPORTANT: Assurez-vous que la propriété s'appelle bien 'isAdmin' (ou 'role') dans la réponse API
      if (user.isAdmin === true) { // Vérification explicite de la valeur booléenne
        console.log("[LoginView] Utilisateur identifié comme ADMIN.");
        // Stocker le token comme token ADMIN
        setAdminAuthToken(token);
        // PAS stocker comme token USER normal (sauf si nécessaire pour votre logique)
        // removeAuthToken(); // S'assurer qu'il n'y a pas de token user normal

        // Rediriger vers le DASHBOARD ADMIN
        console.log("[LoginView] Redirection vers AdminDashboard...");
        // Utilisation de replace pour ne pas pouvoir revenir en arrière sur la page de login
        await router.replace({ name: 'AdminDashboard' });

      } else {
        console.log("[LoginView] Utilisateur identifié comme USER normal.");
        // Stocker le token comme token UTILISATEUR normal
        setAuthToken(token);
        // S'assurer qu'il n'y a pas de token admin
        removeAdminAuthToken();

        // Rediriger vers le DASHBOARD UTILISATEUR normal
        console.log("[LoginView] Redirection vers Dashboard...");
        await router.replace({ name: 'Dashboard' });
      }

    } else {
      // Gérer le cas où l'API répond avec succès mais sans les données attendues
      console.error('[LoginView] Réponse API invalide ou données manquantes:', response.data);
      errorMessage.value = response.data?.message || 'Réponse de connexion inattendue du serveur.';
      // Nettoyer les tokens par sécurité
      removeAuthToken();
      removeAdminAuthToken();
      localStorage.removeItem('userId');
    }
    // --- FIN LOGIQUE MODIFIÉE ---

  } catch (error) {
    console.error('[LoginView] Erreur lors de la connexion:', error.response?.data || error.message || error);
    // Afficher le message d'erreur renvoyé par l'API si disponible
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else if (error.message.includes('Network Error')) {
         errorMessage.value = 'Erreur réseau. Impossible de contacter le serveur.';
    }
    else {
      errorMessage.value = 'Identifiants invalides ou erreur serveur.'; // Message plus générique
    }
     // Nettoyer les tokens par sécurité en cas d'erreur
    removeAuthToken();
    removeAdminAuthToken();
    localStorage.removeItem('userId');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
  /* Vos styles restent inchangés */
  .login-container {
    display: flex;
    min-height: 100vh;
    font-family: sans-serif;
  }

  .form-section {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    background-color: #ffffff;
  }

  .form-content {
    max-width: 400px;
    width: 100%;
    text-align: center;
  }

  h1 {
    color: #000000;
    margin-bottom: 10px;
  }

  .subtitle {
    color: #666;
    margin-bottom: 30px;
  }

  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #fff;
    cursor: pointer;
    font-size: 1rem;
  }
  .google-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .separator {
    display: flex;
    align-items: center;
    text-align: center;
    color: #ccc;
    margin: 20px 0;
  }
  .separator::before,
  .separator::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #eee;
  }
  .separator span {
    padding: 0 10px;
  }

  .form-group {
    margin-bottom: 15px;
    text-align: left;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    color: #333;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .form-group input[type="email"],
  .form-group input[type="password"] {
    width: 100%;
    padding: 12px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box;
  }

  .remember-me {
    display: flex;
    align-items: center;
    text-align: left;
    margin-bottom: 20px;
  }
  .remember-me input[type="checkbox"] {
    margin-right: 8px;
  }
  .remember-me label {
    margin-bottom: 0;
    font-size: 0.9rem;
    color: #555;
  }

  .submit-btn {
    width: 100%;
    padding: 12px;
    background-color: #000;
    color: #ffffff;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: background-color 0.3s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: #333;
  }
  .submit-btn:disabled {
    background-color: #555;
    cursor: not-allowed;
  }

  .login-link {
    margin-top: 20px;
    color: #555;
    font-size: 0.9rem;
  }
  .login-link a {
    color: #000000;
    text-decoration: none;
    font-weight: bold;
  }
  .login-link a:hover {
    text-decoration: underline;
  }

  .error-message {
    color: #e53e3e;
    background-color: #fed7d7;
    border: 1px solid #f56565;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 0.9rem;
    text-align: center; /* Centrer le texte d'erreur */
  }
  /* Retiré le style pour success-message car le message n'est plus affiché */
  /* .success-message { ... } */

  .background-section {
    flex: 1;
    background-color: #3B5EBE; /* Couleur d'exemple */
    /* Vous pouvez ajouter une image de fond ici si nécessaire */
    /* background-image: url('path/to/your/image.jpg'); */
    /* background-size: cover; */
    /* background-position: center; */
  }

  /* Styles pour petits écrans */
  @media (max-width: 768px) {
    .login-container {
      flex-direction: column;
    }
    .background-section {
      display: none;
    }
    .form-section {
      padding: 20px;
      flex: none; /* Pour éviter qu'il ne prenne toute la hauteur */
      min-height: 100vh; /* S'assurer qu'il remplit l'écran sur mobile */
    }
  }
</style>