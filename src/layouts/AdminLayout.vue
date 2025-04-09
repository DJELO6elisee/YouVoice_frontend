<template>
  <!-- Conteneur principal avec la classe CSS 'admin-layout' -->
  <div class="admin-layout">
    <!-- Barre latérale (composant enfant, supposé stylé indépendamment ou via CSS ici) -->
    <AdminSidebar />

    <!-- Contenu Principal (avec la classe CSS 'admin-main-content') -->
    <div class="admin-main-content">
      <!-- En-tête (Optionnel, composant enfant) -->
      <!-- <AdminHeader /> -->

      <!-- Contenu de la page dynamique (avec la classe CSS 'admin-page-content') -->
      <main class="admin-page-content">
        <!-- Le routeur injectera la vue spécifique ici -->
        <router-view :key="$route.fullPath"></router-view>
      </main>
    </div>
  </div>
</template>
  
<script setup>
  import AdminSidebar from '@/components/admin/AdminSidebar.vue';
  // import AdminHeader from '@/components/admin/AdminHeader.vue'; // Si vous l'utilisez
</script>

  <style scoped>
  .admin-layout {
    display: flex;                      /* Met la sidebar et le contenu principal côte à côte */
    min-height: 100vh;                  /* Hauteur minimale = 100% de la hauteur de la fenêtre */
    background-color: #111827;          /* Correspond à bg-gray-900 (gris très sombre/bleu) */
    color: #d1d5db;                     /* Correspond à text-gray-200 (texte gris clair par défaut) */
  }
  
  /* Style pour le conteneur du contenu principal (à droite de la sidebar) */
  .admin-main-content {
    flex-grow: 1;                      /* Prend tout l'espace restant après la sidebar */
    display: flex;                      /* Permet d'organiser l'en-tête (optionnel) et le main */
    flex-direction: column;             /* Header en haut, main en bas */
  }
  
  /* Style pour la zone où le contenu de la page sera injecté */
  .admin-page-content {
    flex-grow: 1;                      /* Prend tout l'espace vertical restant */
    overflow-y: auto;                 /* Ajoute une barre de scroll si le contenu dépasse */
    padding: 1.5rem;                    /* Correspond à p-6 (24px) */
  }
  
  /* Styles pour les écrans plus larges (si vous avez lg:p-8) */
  @media (min-width: 1024px) { /* Correspond à lg: */
    .admin-page-content {
      padding: 2rem;                  /* Correspond à p-8 (32px) */
    }
  }
  
  /* Assurez-vous que AdminSidebar a une largeur définie dans son propre composant
     ou via une classe non-scopée si nécessaire, pour que flexbox fonctionne correctement.
     Exemple (si AdminSidebar n'a pas sa propre largeur) :
     >>> .admin-sidebar {  /* Style global ou non-scoped ciblant le composant enfant */
     /*   width: 250px;
     /*   flex-shrink: 0;
     /* }
  */
</style>