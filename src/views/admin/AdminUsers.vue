<template>
    <!-- Conteneur principal de la page -->
    <div class="admin-users-page">
      <!-- Titre de la page -->
      <h1 class="page-title">Gestion des Utilisateurs</h1>
      <!-- Description -->
      <p class="page-description">Liste et gestion des utilisateurs enregistrés.</p>
  
      <!-- Zone pour filtres/recherche (à remplir) -->
      <div class="filters-section">
         <p class="filter-placeholder">Zone des filtres (recherche nom/email, statut) - À implémenter</p>
          <!-- Ex: <input type="search">, <select> pour statut... -->
      </div>
  
      <!-- Indicateur de chargement -->
       <div v-if="loading" class="loading-message">Chargement des utilisateurs...</div>
       <!-- Indicateur d'erreur -->
       <div v-else-if="error" class="error-message">
          <strong>Erreur!</strong> {{ error }}
       </div>
  
      <!-- Tableau des utilisateurs (composant enfant) -->
      <!-- On passe les utilisateurs chargés à UserDataTable -->
      <UserDataTable v-else :users="users" @block-user="handleBlockUser" @unblock-user="handleUnblockUser" />
  
       <!-- Zone pour la Pagination (à remplir) -->
       <div class="pagination-section">
          <p class="pagination-placeholder">Pagination - À implémenter</p>
          <!-- Composant ou logique de pagination ici -->
       </div>
  
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, reactive, watch } from 'vue'; // Ajout reactive et watch
  import UserDataTable from '@/components/admin/UserDataTable.vue';
  import { getAdminAuthToken } from '@/utils/adminAuth'; // Helper pour token admin
  
  // --- État ---
  const users = ref([]);
  const loading = ref(true);
  const error = ref('');
  
  // --- État pour Pagination et Filtres/Recherche ---
  const currentPage = ref(1);
  const totalPages = ref(1);
  const limit = ref(10); // Nombre d'éléments par page
  const searchTerm = ref('');
  const statusFilter = ref(''); // '', 'active', 'blocked'
  const totalUsers = ref(0); // Pour afficher le nombre total
  
  // --- URLs API ---
  // Adapter selon le montage dans server.js
  const apiAdminBaseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/admin`;
  // OU si monté sous /api/admin:
  // const apiAdminBaseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin`;
  
  // --- Fonction Fetch API ---
  const fetchUsers = async () => {
      loading.value = true;
      error.value = '';
      const token = getAdminAuthToken();
  
      if (!token) {
          error.value = "Authentification Admin requise.";
          loading.value = false;
          return;
      }
  
      // Construire les query params
      const params = new URLSearchParams({
          page: currentPage.value,
          limit: limit.value,
      });
      if (searchTerm.value) params.append('search', searchTerm.value);
      if (statusFilter.value) params.append('status', statusFilter.value);
  
      // Utilise l'endpoint admin GET /api/X/admin/users
      const url = `${apiAdminBaseUrl}/users?${params.toString()}`;
      console.log(`[AdminUsers] Fetching users from: ${url}`);
  
      try {
          const response = await fetch(url, {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
              }
          });
  
          if (!response.ok) {
              let errorMsg = `Erreur ${response.status}`;
              try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch(e){}
              throw new Error(errorMsg);
          }
  
          const result = await response.json();
          console.log("[AdminUsers] Parsed API Response:", result);
  
          // --- Adapter à la structure de VOTRE réponse API ---
          if (result.status === 'success' && Array.isArray(result.data?.users)) {
              users.value = result.data.users;
              totalPages.value = result.totalPages || 1;
              currentPage.value = result.currentPage || 1;
              totalUsers.value = result.totalUsers || 0; // Récupérer le total
              console.log(`[AdminUsers] Loaded ${users.value.length} users. Page ${currentPage.value}/${totalPages.value}. Total: ${totalUsers.value}`);
          } else {
              console.error("Structure de réponse API inattendue pour /api/admin/users:", result);
              throw new Error("Format de réponse API invalide pour les utilisateurs.");
          }
      } catch (err) {
          console.error("Erreur chargement utilisateurs:", err);
          error.value = err.message || "Impossible de charger les utilisateurs.";
          users.value = [];
          totalPages.value = 1;
          currentPage.value = 1;
          totalUsers.value = 0;
      } finally {
          loading.value = false;
      }
  };
  
  // --- Gestion Blocage/Déblocage ---
  const handleUserStatusChange = async (userId, newIsActiveStatus) => {
      const action = newIsActiveStatus ? 'unblock' : 'block';
      console.log(`Tentative de ${action} user: ${userId}`);
      const token = getAdminAuthToken();
      if(!token) { error.value = "Auth requise."; return; } // Afficher erreur
  
      // Utilise l'endpoint admin PATCH /api/X/admin/users/:id/status
      const url = `${apiAdminBaseUrl}/users/${userId}/status`;
      console.log(`[AdminUsers] Sending PATCH to ${url}`);
  
      // Mise à jour optimiste
      const userIndex = users.value.findIndex(u => u.id === userId);
      let originalStatus = null;
      if (userIndex !== -1) {
          originalStatus = users.value[userIndex].isActive;
          users.value[userIndex].isActive = newIsActiveStatus;
      } else {
           console.warn("Utilisateur non trouvé localement pour mise à jour optimiste.");
           // On peut quand même tenter l'appel API
      }
  
      try {
          const response = await fetch(url, {
              method: 'PATCH',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json', // Important pour le body
                  'Accept': 'application/json'
              },
              body: JSON.stringify({ isActive: newIsActiveStatus }) // Envoyer le nouvel état
          });
  
          if (!response.ok) {
               // Annuler l'update optimiste
               if(userIndex !== -1 && originalStatus !== null) users.value[userIndex].isActive = originalStatus;
               let errorMsg = `Erreur ${response.status}`;
               try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch(e){}
               throw new Error(errorMsg);
          }
  
          const result = await response.json(); // Lire la réponse succès
          console.log(`Utilisateur ${userId} ${action} succès:`, result.message);
          // L'état local est déjà à jour grâce à l'update optimiste
  
      } catch (err) {
           console.error(`Erreur lors de l'action '${action}' sur l'utilisateur ${userId}:`, err);
           error.value = `Erreur ${action}: ${err.message}`;
           // Annuler la mise à jour optimiste (au cas où elle n'aurait pas été faite avant)
           if(userIndex !== -1 && originalStatus !== null) {
               users.value[userIndex].isActive = originalStatus;
           }
      }
  };
  
  const handleBlockUser = (userId) => {
      if (window.confirm(`Voulez-vous vraiment bloquer cet utilisateur ?`)) {
          handleUserStatusChange(userId, false); // isActive = false
      }
  };
  
  const handleUnblockUser = (userId) => {
       if (window.confirm(`Voulez-vous vraiment débloquer cet utilisateur ?`)) {
          handleUserStatusChange(userId, true); // isActive = true
       }
  };
  
  // --- Fonctions pour UI (Pagination, Recherche, Filtre) ---
  const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
          currentPage.value = page;
          fetchUsers();
      }
  };
  
  // Pour déclencher la recherche (ex: après un délai ou sur Entrée)
  const triggerSearch = () => {
      currentPage.value = 1; // Reset page on new search
      fetchUsers();
  };
  
  // Pour appliquer un filtre de statut
  const applyStatusFilter = (status) => { // status peut être '', 'active', 'blocked'
      statusFilter.value = status;
      currentPage.value = 1; // Reset page
      fetchUsers();
  };
  
  // Optionnel: Recharger les données quand le terme de recherche change (avec délai)
  let searchTimeout = null;
  watch(searchTerm, (newValue) => {
       clearTimeout(searchTimeout);
       searchTimeout = setTimeout(() => {
           triggerSearch();
       }, 500); // Attendre 500ms après la dernière frappe
  });
  
  
  // Charger au montage
  onMounted(fetchUsers);
  </script>
  
<style scoped>
  /* Conteneur principal de la page */
  .admin-users-page {
    /* Styles généraux si besoin */
  }
  
  /* Titre de la page */
  .page-title {
    font-size: 1.875rem; /* text-3xl */
    line-height: 2.25rem;
    font-weight: 600; /* font-semibold */
    margin-bottom: 1.5rem; /* mb-6 */
    color: #ffffff; /* text-white */
  }
  
  /* Description sous le titre */
  .page-description {
    color: #9ca3af; /* text-gray-400 */
    margin-bottom: 1.5rem; /* mb-6 */
  }
  
  /* Section pour les filtres (styles de base) */
  .filters-section {
    margin-bottom: 1rem; /* mb-4 */
    padding: 0.75rem;
    background-color: #1f2937; /* bg-gray-800 */
    border-radius: 0.375rem; /* rounded */
    border: 1px solid #374151; /* gray-700 */
  }
  .filter-placeholder {
      color: #6b7280; /* gray-500 */
      font-style: italic;
      font-size: 0.875rem;
  }
  
  /* Message de chargement */
  .loading-message {
    text-align: center;
    padding: 2.5rem 0; /* py-10 */
    color: #9ca3af; /* text-gray-400 */
    font-style: italic;
  }
  
  /* Message d'erreur */
  .error-message {
    background-color: #450a0a; /* bg-red-900 approx */
    border: 1px solid #7f1d1d; /* border-red-700 approx */
    color: #fecaca; /* text-red-200 */
    padding: 0.75rem 1rem; /* px-4 py-3 */
    border-radius: 0.25rem; /* rounded */
    margin-bottom: 1rem; /* mb-4 */
  }
  .error-message strong {
      font-weight: 700; /* font-bold */
      margin-right: 0.5rem;
  }
  
  /* Section pour la pagination (styles de base) */
  .pagination-section {
    margin-top: 1.5rem; /* mt-6 */
     padding: 0.75rem;
     text-align: center;
     border-top: 1px solid #374151; /* gray-700 */
  }
  .pagination-placeholder {
      color: #6b7280; /* gray-500 */
      font-style: italic;
      font-size: 0.875rem;
  }
</style>