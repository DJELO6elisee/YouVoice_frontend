<template>
    <div class="register-container">
      <div class="form-section">
        <div class="form-content">
          <h1>BIENVENUE</h1>
          <p class="subtitle">Créer votre compte et explorer YOUVOICE</p>
  
          <!-- Bouton Google (non fonctionnel pour l'instant) -->
          <button class="google-btn">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo" width="20" height="20">
            Continue With Google
          </button>
  
          <div class="separator">
            <span>Or</span>
          </div>
  
          <form @submit.prevent="handleRegister">
            <div class="form-group">
              <label for="username">Nom</label>
              <input type="text" id="username" v-model="formData.username" placeholder="Entrez votre nom" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="formData.email" placeholder="Entrez votre email" required>
            </div>
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input type="password" id="password" v-model="formData.password" placeholder="Créez un mot de passe" required>
            </div>
            <div class="form-group">
              <label for="passwordConfirm">Mot de passe (confirmation)</label>
              <input type="password" id="passwordConfirm" v-model="formData.passwordConfirm" placeholder="Confirmez votre mot de passe" required>
            </div>
  
            <!-- Checkbox "Se souvenir de moi" (non fonctionnel pour l'instant) -->
            <div class="form-group remember-me">
              <input type="checkbox" id="rememberMe" v-model="formData.rememberMe">
              <label for="rememberMe">Se souvenir de moi</label>
            </div>
  
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
             <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
  
            <button type="submit" class="submit-btn" :disabled="isLoading">
              {{ isLoading ? 'Inscription en cours...' : 'S\'inscrire' }}
            </button>
          </form>
  
          <p class="login-link">
            Vous avez déjà un compte ? <router-link to="/login">Connectez-vous</router-link>
            <!-- Ce lien fonctionnera car Vue Router est configuré -->
          </p>
        </div>
      </div>
      <div class="background-section">
        <!-- La couleur de fond remplace l'image -->
      </div>
    </div>
</template>
  
<script setup>
  import { ref } from 'vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router'; // Importer le router
  
  const router = useRouter(); // Initialiser le router
  
  const formData = ref({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    rememberMe: false 
  });
  
  const isLoading = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');
  
  const API_BASE_URL = 'https://youvoiceapi-production.up.railway.app/api';
  
  const handleRegister = async () => {
    errorMessage.value = '';
    successMessage.value = '';
  
    if (!formData.value.username || !formData.value.email || !formData.value.password || !formData.value.passwordConfirm) {
      errorMessage.value = 'Veuillez remplir tous les champs requis.';
      return;
    }
    if (formData.value.password !== formData.value.passwordConfirm) {
      errorMessage.value = 'Les mots de passe ne correspondent pas.';
      return;
    }
     if (formData.value.password.length < 6) { 
       errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères.';
       return;
     }
  
    isLoading.value = true;
  
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: formData.value.username,
        email: formData.value.email,
        password: formData.value.password
      });
  
      console.log('Registration successful:', response.data);
      successMessage.value = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
      
      setTimeout(() => {
        router.push({ name: 'Login' });
      }, 2000); 

    } catch (error) {
      console.error('Registration error:', error.response || error);
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message;
      } else if (error.request) {
         errorMessage.value = 'Erreur de réseau. Veuillez vérifier votre connexion et réessayer.';
      } else {
        errorMessage.value = 'Une erreur inattendue est survenue lors de l\'inscription.';
      }
    } finally {
      isLoading.value = false;
    }
  };
</script>
  
<style scoped>
  /* Styles identiques à la version précédente */
  .register-container {
    display: flex;
    min-height: 100vh;
    font-family: sans-serif;
  }
  
  .form-section {
    flex: 1; /* Prend la moitié de l'espace */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    background-color: #ffffff; /* Fond blanc pour le formulaire */
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
  
  .form-group input[type="text"],
  .form-group input[type="email"],
  .form-group input[type="password"] {
    width: 100%;
    padding: 12px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box; /* Important pour que padding ne déborde pas */
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
    background-color: #000000;
    color: #ffffff;
    border: none;
    border-radius: 25px; /* Bouton arrondi */
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
    color: #000000; /* Ou une autre couleur pour le lien */
    text-decoration: none;
    font-weight: bold;
  }
  .login-link a:hover {
    text-decoration: underline;
  }
  
  .error-message {
    color: #e53e3e; /* Rouge pour les erreurs */
    background-color: #fed7d7;
    border: 1px solid #f56565;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }
  .success-message {
    color: #38a169; /* Vert pour le succès */
    background-color: #c6f6d5;
    border: 1px solid #68d391;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }
  
  
  .background-section {
    flex: 1; /* Prend l'autre moitié */
    background-color: #3B5EBE;
  }
  
  /* Styles pour petits écrans */
  @media (max-width: 768px) {
    .register-container {
      flex-direction: column;
    }
    .background-section {
      display: none; /* Cacher la section couleur sur mobile */
    }
    .form-section {
       padding: 20px; /* Moins de padding sur mobile */
    }
  }
</style>