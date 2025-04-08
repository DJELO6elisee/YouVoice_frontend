<template>
  <header class="app-navbar">
    <div class="navbar-left">
      <!-- Utiliser la ref locale userName -->
      <h1>YOUVOICE</h1>
      <!-- <p class="date">{{ currentDate }}</p> -->
    </div>
    <div class="navbar-right">
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="search" placeholder="Search" @input="handleSearch" />
      </div>
      <button class="icon-button notifications" aria-label="Notifications">
        <i class="fa-regular fa-bell"></i>
        <!-- <span class="notification-badge">3</span> -->
      </button>
      <button class="icon-button user-profile-nav" aria-label="User Profile">
         <!-- Optionnel: Afficher indicateur pendant chargement -->
         <span v-if="isLoading" class="navbar-avatar-loading"></span>
         <!-- Optionnel: Afficher icône erreur -->
         <i v-else-if="error" class="fa-solid fa-circle-exclamation navbar-avatar-error" :title="error"></i>
         <!-- Afficher l'avatar si chargé et sans erreur -->
         <img v-else
              :src="userAvatarUrl"
              alt="User Avatar"
              class="navbar-avatar" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; // Ajout de onMounted

// Supprimer defineProps si userName et userAvatarUrl ne sont plus passés en props
// const props = defineProps({ ... });

// --- NOUVEAU: State local pour les infos utilisateur ---
const userName = ref('');
const userAvatarPath = ref(''); // Stocke le chemin relatif de l'avatar
const isLoading = ref(true); // État de chargement
const error = ref('');      // État d'erreur

// --- URLs API ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiUrlBase = import.meta.env.VITE_API_URL_BASE || 'http://localhost:5000'; // Pour les fichiers statiques

// --- NOUVEAU: Propriété calculée pour l'URL complète de l'avatar ---
const userAvatarUrl = computed(() => {
    const placeholder = 'https://via.placeholder.com/32?text=?'; // Placeholder 32x32
    const avatarPath = userAvatarPath.value;

    if (!avatarPath) { return placeholder; }
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) { return avatarPath; }
    if (!apiUrlBase) { console.warn("[Navbar Avatar] apiUrlBase manquant."); return placeholder; }

    try {
        return new URL(avatarPath, apiUrlBase).href;
    } catch (e) {
        console.error(`[Navbar Avatar] Erreur URL pour ${avatarPath} base ${apiUrlBase}:`, e);
        return placeholder;
    }
});

// --- NOUVEAU: Fonction getAuthToken ---
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// --- NOUVEAU: Fonction pour fetch le profil ---
const fetchUserProfile = async () => {
    isLoading.value = true;
    error.value = '';
    const token = getAuthToken();

    if (!token) {
        error.value = 'Non auth.'; // Message court pour la barre
        isLoading.value = false;
        // Pas de redirection ici, l'utilisateur est peut-être déjà sur une page publique
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });

        const responseBodyText = await response.text(); // Lire en texte

        if (!response.ok) {
            let errorMsg = `Erreur ${response.status}`;
             if (response.status === 401) { // Gérer spécifiquement 401 si besoin
                errorMsg = "Non auth.";
                // Optionnel: Déclencher une déconnexion globale si nécessaire
                // handleLogout(); // Assurez-vous que handleLogout existe si vous décommentez
             } else {
                try { const errData = JSON.parse(responseBodyText); errorMsg = errData.message || `Erreur serv. (${response.status})`; }
                catch (e) { errorMsg = `Erreur serv. (${response.status})`; }
             }
            throw new Error(errorMsg);
        }

        const result = JSON.parse(responseBodyText); // Parser après vérification OK

        if (result.status === 'success' && result.data?.user) {
            const user = result.data.user;
            userName.value = user.username || ''; // Utiliser username
            userAvatarPath.value = user.avatar || ''; // Stocker le chemin relatif
             console.log('Navbar profile loaded:', { name: userName.value, avatarPath: userAvatarPath.value });
        } else {
            throw new Error('Réponse API profil invalide.');
        }

    } catch (err) {
        console.error('Erreur chargement profil (Navbar):', err);
        error.value = err.message || 'Erreur profil'; // Message court
    } finally {
        isLoading.value = false;
    }
};

// --- NOUVEAU: Hook onMounted ---
onMounted(() => {
    fetchUserProfile();
});


// --- Fonctions existantes ---
const currentDate = computed(() => { /* ... (inchangé) ... */ });
const handleSearch = (event) => { /* ... (inchangé) ... */ };

</script>

<style scoped>
.app-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #fff;
  color: #374151; /* Couleur de texte principale */
}

.navbar-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.navbar-left h1 {
  margin: 0 0 2px 0;
  font-size: 1.2em;
  font-weight: bold;
  color: #0c049f;
}

.navbar-left .date {
  margin: 0;
  font-size: 0.85em;
  color: #6b7280; /* Gris plus foncé pour la date */
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px; /* Espace entre les éléments de droite */
}

.search-bar {
  position: relative;
}

.search-bar .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af; /* Couleur de l'icône */
  font-size: 0.9em;
}

.search-bar input {
  padding: 8px 12px 8px 35px; /* Espace pour l'icône à gauche */
  border: 1px solid #d1d5db; /* Bordure grise */
  border-radius: 20px; /* Bords très arrondis */
  min-width: 250px; /* Largeur minimale */
  background-color: #f9fafb; /* Fond très légèrement gris */
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.search-bar input:focus {
  border-color: #3b82f6; /* Bordure bleue au focus */
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); /* Ombre légère bleue */
}

.icon-button {
  background: none;
  border: 1px solid #d1d5db; /* Bordure comme search */
  border-radius: 50%; /* Boutons ronds */
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #6b7280; /* Couleur icône */
  transition: background-color 0.2s ease, color 0.2s ease;
  position: relative; /* Pour le badge éventuel */
}
.icon-button:hover {
  background-color: #f3f4f6; /* Léger fond gris au survol */
  color: #374151;
}
.icon-button i {
    font-size: 1.1em;
}

/* Style spécifique pour l'avatar */
.user-profile-nav {
    padding: 0; /* Pas de padding intérieur pour le bouton avatar */
    overflow: hidden; /* Pour s'assurer que l'image ronde reste bien ronde */
}
.navbar-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Style pour un badge de notification (exemple) */
.notification-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    background-color: red;
    color: white;
    border-radius: 50%;
    font-size: 0.7em;
    width: 16px;
    height: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
}
</style>