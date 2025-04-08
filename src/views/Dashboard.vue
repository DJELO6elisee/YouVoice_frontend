<template>
  <div class="app-container">
    <!-- MODIFICATION: Ajout du bouton Menu et appel de toggleMobileSidebar -->
    <button v-if="isMobileView" class="menu-toggle-button" @click="toggleMobileSidebar">
      <i class="fa-solid fa-bars"></i>
    </button>

    <TopBar />
    <div class="main-layout">
      <!-- MODIFICATION: Ajout de la ref="sidebarRef" -->
      <SideBar ref="sidebarRef" @show-recorder="activateRecorderView" />

      <div class="content-area">
        <!-- Affiche le Feed si l'enregistreur n'est PAS montré -->
        <MainContent
          v-if="!showRecorder && loggedInUserId"
          :current-user-id="loggedInUserId"
          :backend-url="apiUrlBase"
        />
        <!-- Affiche un message si l'utilisateur n'est pas connecté mais qu'on n'est pas sur l'enregistreur -->
         <div v-else-if="!showRecorder && !loggedInUserId" class="login-prompt">
             Veuillez vous connecter pour voir le fil d'actualité.
         </div>
        <!-- Affiche l'enregistreur si showRecorder est vrai -->
        <AudioRecorderUI
          v-else-if="showRecorder"
          @delete="handleRecorderAction('delete')"
          @send="handleRecorderAction('send')"
          @pause="handleRecorderPause"
        />
      </div>

    </div>
    <FloatingActionButton @click="activateRecorderView"/>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'; // Ajout de onUnmounted et computed
import TopBar from '@/components/HeaderBar.vue';
import SideBar from '@/components/SideBar.vue';
import MainContent from '@/components/MainContent.vue'; // Ajuste le chemin
import AudioRecorderUI from '@/components/AudioRecorderUI.vue';
import FloatingActionButton from '@/components/FloatingActionButton.vue';

// État pour contrôler l'affichage
const showRecorder = ref(false);

// État pour les props du Feed
const loggedInUserId = ref(null);
// MODIFICATION: Renommer en apiUrlBase pour correspondre à son usage (fichiers statiques)
const apiUrlBase = ref(import.meta.env.VITE_API_URL_BASE || 'http://localhost:5000'); // Utiliser la variable d'env ou défaut

// --- AJOUT: Logique pour le menu mobile ---
const sidebarRef = ref(null); // Référence au composant Sidebar
const windowWidth = ref(window.innerWidth); // Suivre la largeur de la fenêtre

// Propriété calculée pour déterminer si on est en vue mobile
const isMobileView = computed(() => windowWidth.value < 992); // Utilise le même breakpoint que le CSS de la sidebar

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  // Optionnel: Fermer automatiquement la sidebar si on redimensionne en mode desktop
  if (!isMobileView.value && sidebarRef.value) {
      sidebarRef.value.closeSidebar();
  }
};

const toggleMobileSidebar = () => {
  // Appelle la méthode exposée par la Sidebar
  sidebarRef.value?.toggleSidebar();
};
// --- FIN AJOUT LOGIQUE MOBILE ---

// Fonction pour activer la vue de l'enregistreur
const activateRecorderView = () => {
  console.log('Dashboard: Activation vue enregistreur');
  showRecorder.value = true;
  // Fermer la sidebar si on est sur mobile et qu'on active l'enregistreur
  if (isMobileView.value && sidebarRef.value) {
    sidebarRef.value.closeSidebar();
  }
};

// Fonction pour revenir à la vue principale
const handleRecorderAction = (actionType) => {
  console.log(`Dashboard: Action enregistreur (${actionType}) terminée, retour vue principale`);
  showRecorder.value = false;
  if (actionType === 'send') {
      console.warn("Action 'send' terminée. Implémentez le rafraîchissement du feed !");
      // TODO: Rafraîchir le feed
  }
};

const handleRecorderPause = (isPaused) => {
    console.log('Recorder pause state:', isPaused);
    // Logique à ajouter si nécessaire
};


// Récupérer l'ID utilisateur et ajouter/retirer l'écouteur de redimensionnement
onMounted(() => {
    loggedInUserId.value = localStorage.getItem('userId');
    if (!loggedInUserId.value) {
        console.warn("DashboardLayout: Aucun userId trouvé dans localStorage.");
    } else {
        console.log("DashboardLayout: Utilisateur connecté avec ID:", loggedInUserId.value);
    }
    // Ajouter l'écouteur de redimensionnement
    window.addEventListener('resize', handleResize);
    // Exécuter une fois pour définir l'état initial
    handleResize();
});

// --- AJOUT: Retirer l'écouteur au démontage ---
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
  flex-grow: 1;
  overflow-y: auto; /* Permet le scroll si le contenu dépasse */
  padding: 25px;
  display: flex;
  flex-direction: column;
  background-color: #F0F2F5;

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


/* --- Ajustements pour le layout avec sidebar fixe sur desktop --- */
@media (min-width: 992px) {
    .main-layout {
        /* La sidebar est maintenant position: sticky, elle prend sa place dans le flex */
        /* Pas besoin de style spécifique ici si SideBar a sa propre largeur */
    }
    .content-area {
        /* La largeur sera automatiquement ajustée par flex-grow */
        height: 100%; /* Assure que le scroll se fait bien ici */
    }
}
</style>