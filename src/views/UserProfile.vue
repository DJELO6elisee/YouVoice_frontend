<template>
    <div class="app-container">
      <!-- TopBar n'est plus dans UserProfile, donc on le garde ici si besoin -->
      <TopBar :user-name="user.name" :user-avatar-url="user.avatarUrl" />
       <!-- Vous n'avez peut-être plus besoin de TopBar ici si UserProfile gère tout le contenu visible -->
  
      <div class="main-layout">
        <SideBar @show-recorder="activateRecorderView" />
        <div class="profile-page">
  
          <!-- ICI : Ajout du composant UserProfile -->
          <Profile />
          <!-- FIN de l'ajout -->
  
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  // Supprimez TopBar si vous ne l'utilisez plus ici
  import TopBar from '@/components/HeaderBar.vue';
  import SideBar from '@/components/SideBar.vue';
  
  // ICI : Import du composant UserProfile
  import Profile from '@/components/Profile.vue'; // Assurez-vous que le chemin est correct!
  
  // Vous n'avez peut-être plus besoin de ces données utilisateur ici si UserProfile les gère
  const user = ref({
    name: 'YOUVOICE', // Exemple
    avatarUrl: 'https://via.placeholder.com/40' // Exemple
  });
  
  // Le ref pour showRecorder reste pertinent si SideBar l'utilise
  const showRecorder = ref(false);
  const activateRecorderView = () => {
      showRecorder.value = true;
      // Potentiellement, vous pourriez aussi vouloir masquer UserProfile ici
      // ou naviguer vers une autre vue
      console.log("Affichage de l'enregistreur demandé");
  };
  
  // Logique pour récupérer les données réelles irait ici (ex: dans onMounted)
  onMounted(() => {
    // fetchUserProfileData(); // Peut-être déplacé dans UserProfile.vue si c'est plus logique
    // fetchPublicationHistory(); // Idem
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
  
  /* Vous pouvez retirer les styles spécifiques à l'ancien contenu de profile-page s'il y en avait */
  
</style>