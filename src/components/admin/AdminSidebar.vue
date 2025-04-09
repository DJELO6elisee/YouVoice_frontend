<template>
  <!-- Utilise la classe CSS 'admin-sidebar' définie dans <style> -->
  <aside class="admin-sidebar">
    <!-- Logo/Titre (utilise la classe 'logo') -->
    <div class="logo">
      YouVoiceAdmin
    </div>

    <!-- Navigation (utilise la classe 'main-navigation') -->
    <nav class="main-navigation">
      <ul>
        <li>
          <!-- Utilise la classe 'nav-link' et 'active-class' -->
          <router-link :to="{ name: 'AdminDashboard' }" class="nav-link" active-class="active">
            <i class="fas fa-tachometer-alt"></i> <!-- Icône -->
            <span>Tableau de Bord</span>
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'AdminUsers' }" class="nav-link" active-class="active">
            <i class="fas fa-users"></i>
            <span>Utilisateurs</span>
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'AdminReports' }" class="nav-link" active-class="active">
            <i class="fas fa-flag"></i>
            <span>Signalements</span>
            <!-- Optionnel: Badge (Style à définir si besoin) -->
            <!-- <span class="badge">{{ pendingReportCount }}</span> -->
          </router-link>
        </li>
        <!-- Ajoutez d'autres liens ici -->
      </ul>
    </nav>

    <!-- Section Déconnexion (utilise la classe 'logout-section') -->
    <div class="logout-section">
       <!-- Utilise la classe 'nav-link' et 'logout-button' -->
      <button @click="logoutAdmin" class="nav-link logout-button">
        <i class="fas fa-sign-out-alt"></i>
        <span>Déconnexion Admin</span>
      </button>
    </div>
  </aside>
</template>
  
<script setup>
  import { useRouter } from 'vue-router';

  const router = useRouter();

  const logoutAdmin = () => {
    console.log("Déconnexion Admin...");
    localStorage.removeItem('adminAuthToken'); // Utilisez le nom de token approprié
    // Rediriger vers la page de connexion admin (assurez-vous que la route existe)
    router.push({ name: 'Login' });
  }

  // Logique pour le badge de signalements (à implémenter avec Pinia ou props)
  // import { ref } from 'vue';
  // const pendingReportCount = ref(0);
</script>
  
<style scoped>
/* Style principal de la sidebar */
.admin-sidebar {
  width: 250px; /* Correspondait à w-64 */
  background-color: #1f2937; /* Correspondait à bg-gray-800 */
  padding: 1rem; /* Correspondait à p-4 */
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh; /* Correspondait à h-screen */
  position: sticky; /* ou fixed selon le layout parent */
  top: 0;
  color: #e2e8f0; /* Correspondait à text-gray-200 (approximatif) */
}

/* Style du logo/titre */
.logo {
  color: #ffffff; /* Correspondait à text-white */
  font-size: 1.5rem; /* Correspondait à text-2xl */
  line-height: 2rem;
  font-weight: 600; /* Correspondait à font-semibold */
  margin-bottom: 2rem; /* Correspondait à mb-8 */
  text-align: center;
}

/* Style de la section de navigation principale */
.main-navigation {
  flex-grow: 1; /* Correspondait à flex-1 */
}
/* Style de base pour la liste de navigation */
.main-navigation ul {
    list-style: none;
    padding: 0;
    margin: 0;
}
/* Style de base pour les éléments de liste */
.main-navigation li {
    margin-bottom: 5px; /* Ajoute un petit espace entre les liens */
}


/* Style commun des liens/boutons de navigation */
.nav-link {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-radius: 6px;
  color: #a0aec0; /* Couleur par défaut (gris clair) */
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
  width: 100%; /* Pour que le bouton logout prenne toute la largeur */
  box-sizing: border-box; /* Inclut padding dans la largeur */
  background: none; /* Assure pas de fond par défaut pour le bouton */
  border: none; /* Assure pas de bordure par défaut pour le bouton */
  cursor: pointer; /* Curseur main pour le bouton */
  text-align: left; /* Aligne le texte du bouton à gauche */
  font-family: inherit; /* Hérite la police */
  font-size: inherit; /* Hérite la taille de police */
}

/* Style de l'icône dans les liens */
.nav-link i {
  margin-right: 0.75rem; /* Correspondait à mr-3 */
  width: 1.25rem; /* Correspondait à w-5 */
  text-align: center; /* Centre l'icône dans son espace */
  flex-shrink: 0; /* Empêche l'icône de rétrécir */
}

/* Style du lien au survol */
.nav-link:hover {
  background-color: #4a5568; /* Gris plus foncé (bg-gray-700 approx) */
  color: white;
}

/* Style du lien actif (via active-class de router-link) */
.nav-link.active {
  background-color: #4a5568; /* Même couleur que hover pour l'exemple */
  color: white;
  font-weight: 500; /* Un peu plus gras */
}

/* Conteneur de la section de déconnexion */
.logout-section {
  margin-top: auto; /* Pousse vers le bas */
  padding-top: 1rem; /* Espace au-dessus */
  border-top: 1px solid #4a5568; /* Ligne de séparation */
}

/* Style spécifique pour le bouton de déconnexion */
.logout-button {
  color: #f87171; /* Rouge clair (text-red-400 approx) */
}
.logout-button:hover {
  background-color: #991b1b; /* Rouge foncé (bg-red-800 approx) */
  color: #ffffff; /* Texte blanc au survol */
}

/* Style optionnel pour le badge (si vous l'ajoutez) */
.badge {
  margin-left: auto; /* Pousse à droite */
  background-color: #dc2626; /* Rouge (bg-red-600 approx) */
  color: white;
  font-size: 0.75rem; /* Correspondait à text-xs */
  font-weight: 700; /* Correspondait à font-bold */
  padding: 2px 8px; /* Correspondait à px-2 py-0.5 approx */
  border-radius: 9999px; /* Correspondait à rounded-full */
  line-height: 1; /* Pour un bon affichage vertical */
}
</style>