<template>
  <div class="app-container">
    <button v-if="isMobileView" class="menu-toggle-button" @click="toggleMobileSidebar">
      <i class="fa-solid fa-bars"></i>
    </button>

    <!-- Écouter l'événement 'search' émis par TopBar -->
    <TopBar @search="handleSearchUpdate" />

    <div class="main-layout">
      <SideBar ref="sidebarRef" @show-recorder="activateRecorderView" />

      <div class="content-area">
        <!-- Affiche le Feed si l'enregistreur n'est PAS montré -->
        <MainContent
          v-if="!showRecorder && loggedInUserId"
          :current-user-id="loggedInUserId"
          :backend-url="apiUrlBase"
          :search-term="currentSearchTerm"
        />
        <!-- Affiche un message si l'utilisateur n'est pas connecté -->
         <div v-else-if="!showRecorder && !loggedInUserId" class="login-prompt">
             Veuillez vous <router-link to="/login">connecter</router-link> pour voir le fil d'actualité.
         </div>
        <!-- Affiche l'enregistreur si showRecorder est vrai -->
        <AudioRecorderUI
          v-else-if="showRecorder"
          @delete="handleRecorderAction('delete')"
          @send="handleRecorderAction('send')"
          @pause="handleRecorderPause"
        />
         <!-- Optionnel: Message si l'enregistreur est montré et que l'user n'est pas connecté -->
         <div v-else-if="showRecorder && !loggedInUserId" class="login-prompt">
             Veuillez vous <router-link to="/login">connecter</router-link> pour enregistrer une note vocale.
             <!-- Ou désactiver l'enregistreur si non connecté -->
         </div>
      </div>

    </div>
    <!-- Masquer le bouton flottant si l'enregistreur est déjà affiché -->
    <FloatingActionButton v-if="!showRecorder && loggedInUserId" @click="activateRecorderView"/>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import TopBar from '@/components/HeaderBar.vue'; // Assurez-vous que le nom correspond (HeaderBar vs TopBar)
import SideBar from '@/components/SideBar.vue';
import MainContent from '@/components/MainContent.vue';
import AudioRecorderUI from '@/components/AudioRecorderUI.vue';
import FloatingActionButton from '@/components/FloatingActionButton.vue';
// Optionnel: Si vous utilisez vue-router pour le lien de connexion
// import { RouterLink } from 'vue-router';

// --- État Principal ---
const showRecorder = ref(false);
const loggedInUserId = ref(null);
const apiUrlBase = ref(import.meta.env.VITE_API_URL_BASE || 'https://youvoiceapi-production.up.railway.app');

// --- NOUVEAU: État pour la recherche ---
const currentSearchTerm = ref(''); // Stocke le terme de recherche actuel

// --- État et logique pour la vue mobile ---
const sidebarRef = ref(null);
const windowWidth = ref(window.innerWidth);
const isMobileView = computed(() => windowWidth.value < 992);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (!isMobileView.value && sidebarRef.value) {
      sidebarRef.value.closeSidebar();
  }
};

const toggleMobileSidebar = () => {
  sidebarRef.value?.toggleSidebar();
};

// --- Fonctions de navigation / affichage ---
const activateRecorderView = () => {
  console.log('Dashboard: Activation vue enregistreur');
  // Vérifier si l'utilisateur est connecté avant d'activer
  if (!loggedInUserId.value) {
      console.warn("Tentative d'activation de l'enregistreur sans être connecté.");
       // Optionnel: rediriger vers login ou afficher un message
       alert("Veuillez vous connecter pour enregistrer une note vocale."); // Simple alerte
       // Ou utiliser un système de notification plus élégant
      return;
  }
  showRecorder.value = true;
  if (isMobileView.value && sidebarRef.value) {
    sidebarRef.value.closeSidebar();
  }
};

const handleRecorderAction = (actionType) => {
  console.log(`Dashboard: Action enregistreur (${actionType}) terminée, retour vue principale`);
  showRecorder.value = false;
  if (actionType === 'send') {
      console.warn("Action 'send' terminée. Implémentez le rafraîchissement du feed dans MainContent!");
      // IMPORTANT: MainContent devrait idéalement s'auto-rafraîchir ou vous devez
      // trouver un moyen de lui signaler de le faire (ex: via un événement ou une ref).
      // Une approche simple mais pas idéale serait de forcer une clé de re-rendu sur MainContent.
  }
};

const handleRecorderPause = (isPaused) => {
    console.log('Recorder pause state:', isPaused);
};

// --- NOUVEAU: Handler pour la mise à jour de la recherche ---
const handleSearchUpdate = (searchTermFromHeader) => {
    console.log('[DashboardLayout] Terme de recherche reçu:', searchTermFromHeader);
    currentSearchTerm.value = searchTermFromHeader.trim(); // Met à jour la ref locale
    // Si l'enregistreur est affiché, on pourrait choisir de ne pas le fermer
    // ou de le fermer pour afficher directement les résultats.
    // Pour l'instant, on met juste à jour la valeur, MainContent s'en chargera.
    // Si MainContent n'est pas visible (showRecorder=true), il prendra en compte
    // la nouvelle valeur lors de sa prochaine réapparition.
};

// --- Cycle de vie ---
onMounted(() => {
    loggedInUserId.value = localStorage.getItem('userId');
    if (!loggedInUserId.value) {
        console.warn("DashboardLayout: Aucun userId trouvé.");
    } else {
        console.log("DashboardLayout: User ID:", loggedInUserId.value);
    }
    window.addEventListener('resize', handleResize);
    handleResize(); // Appel initial
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

</script>


<style scoped>
/* Styles existants */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-layout {
  display: flex;
  flex-grow: 1;
  /* La hauteur est gérée par flex-grow, calc n'est pas nécessaire si TopBar n'est pas fixed */
  height: 100%; /* Ou flex-basis: 0; pour une meilleure sémantique flex */
  overflow: hidden; /* Empêche le layout principal de déborder */
  background-color: #fff;
  position: relative; /* Pour le positionnement de la sidebar sticky */
}

/* Style pour le message de connexion */
.login-prompt {
    text-align: center;
    color: #666;
    margin-top: 50px; /* Un peu d'espace */
    font-size: 1.1em;
}

.content-area {
  flex-grow: 1; /* Prend tout l'espace restant à droite de la sidebar */
  overflow-y: auto; /* Permet UNIQUEMENT au contenu de scroller */
  padding: 20px; /* Padding par défaut */
  background-color: #F0F2F5; /* Fond de la zone de contenu */
  padding-bottom: 120px; /* << AJOUT: Espace supplémentaire en bas (ajustez la valeur) */
  box-sizing: border-box;
  
}

/* --- AJOUT: Styles pour le bouton Menu Mobile --- */
.menu-toggle-button {
  position: fixed; /* Fixé par rapport à la fenêtre */
  top: 15px; /* Ajuste la position verticale */
  left: 0; /* Ajuste la position horizontale */
  z-index: 900; /* Au-dessus de la sidebar et de l'overlay */
  background-color: rgba(255, 255, 255, 0.9); /* Fond légèrement transparent */
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 33px;
  height: 33px;
  font-size: 1.2em;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  transition: background-color 0.2s;
}
.menu-toggle-button:hover {
  background-color: #f0f0f0;
}
/* Cache le bouton sur les écrans larges par défaut */
@media (min-width: 992px) { /* Doit correspondre au breakpoint de la Sidebar */
  .menu-toggle-button {
    display: none;
  }
}
/* --- FIN AJOUT STYLES MOBILE --- */

@media (min-width: 640px) { /* sm: */
  .content-area { padding: 25px; padding-bottom: 60px; } /* Moins de padding bas sur desktop */
}

@media (max-width: 864px) { /* sm: */
  .content-area { padding: 25px; padding-bottom: 100px; } /* Moins de padding bas sur desktop */
}

/* --- Ajustements pour le layout avec sidebar fixe sur desktop --- */
@media (min-width: 992px) {
    
    .content-area {
        /* La largeur sera automatiquement ajustée par flex-grow */
        height: 100%; /* Assure que le scroll se fait bien ici */
        overflow-y: auto;
        .content-area { padding: 25px; padding-bottom: 95px; } /* Moins de padding bas sur desktop */

    }
}
</style>