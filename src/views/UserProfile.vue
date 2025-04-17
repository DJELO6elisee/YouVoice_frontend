<template>
    <div class="app-container">
      <button v-if="isMobileView" class="menu-toggle-button" @click="toggleMobileSidebar">
      <i class="fa-solid fa-bars"></i>
      </button>
      <!-- TopBar n'est plus dans UserProfile, donc on le garde ici si besoin -->
      <TopBar :user-name="user.name" :user-avatar-url="user.avatarUrl" />
       <!-- Vous n'avez peut-être plus besoin de TopBar ici si UserProfile gère tout le contenu visible -->
  
      <div class="main-layout">
        <SideBar ref="sidebarRef" @show-recorder="activateRecorderView" />
        <div class="profile-page">
  
          <!-- ICI : Ajout du composant UserProfile -->
          <Profile />
          <!-- FIN de l'ajout -->
  
        </div>
      </div>
    </div>
</template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  // Supprimez TopBar si vous ne l'utilisez plus ici
  import TopBar from '@/components/HeaderBar.vue';
  import SideBar from '@/components/SideBar.vue';
  
  import Profile from '@/components/Profile.vue'; // Assurez-vous que le chemin est correct!
  
  const user = ref({
    name: 'YOUVOICE', 
    avatarUrl: 'https://via.placeholder.com/40' 
  });
  
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
  // Le ref pour showRecorder reste pertinent si SideBar l'utilise
  const showRecorder = ref(false);
  const activateRecorderView = () => {
      showRecorder.value = true;
      // Potentiellement, vous pourriez aussi vouloir masquer UserProfile ici
      // ou naviguer vers une autre vue
      console.log("Affichage de l'enregistreur demandé");
  };
  

  // --- Cycle de vie ---
onMounted(() => {
  
  window.addEventListener('resize', handleResize);
  handleResize(); // Appel initial

  console.log('Composant parent monté.');

});


</script>
  
<style scoped>
  
  /* Styles existants */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh; /* Hauteur totale de la fenêtre */
    overflow: hidden; /* Empêche le body de scroller */
    background-color: #f0f0f7; /* Assortir l'arrière-plan si nécessaire */
  }
  
  .main-layout {
    display: flex;
    flex-grow: 1; /* Prend la hauteur restante */
    overflow: hidden; /* Empêche .main-layout lui-même de déborder */
  }
  
  .profile-page {
    flex-grow: 1; /* Fait en sorte que cette div prenne l'espace restant */
    overflow-y: auto; /* Permet le défilement si UserProfile est plus grand que l'espace */
    /* Pas besoin de padding ici si UserProfile.vue gère son propre padding */
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
</style>