<template>
    <!-- Conteneur principal de la page -->
    <div class="admin-reports-page">
      <!-- Titre de la page -->
      <h1 class="page-title">Gestion des Signalements</h1>
      <!-- Description -->
      <p class="page-description">Examiner et traiter les signalements des utilisateurs.</p>
  
       <!-- Zone pour les Filtres -->
       <div class="filters-section">
          <label for="status-filter" class="filter-label">Filtrer par statut: </label>
          <select id="status-filter" v-model="currentStatusFilter" @change="applyFilter" class="filter-select">
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="resolved">Résolu</option>
              <option value="rejected">Rejeté</option>
               <!-- Ajoutez 'under_review' si vous l'utilisez -->
          </select>
       </div>
  
       <!-- Indicateur de chargement -->
       <div v-if="loading && reports.length === 0" class="loading-message"> <!-- Affiché seulement au chargement initial -->
           <i class="fas fa-spinner fa-spin"></i> Chargement des signalements...
       </div>
       <!-- Indicateur d'erreur -->
       <div v-else-if="error" class="error-message">
         <strong>Erreur!</strong> {{ error }}
         <button @click="fetchReports" class="retry-button small">Réessayer</button>
       </div>
  
      <!-- Affiche la liste même si loading est true pour les rechargements/pagination -->
      <ReportList v-else-if="reports.length > 0" :reports="reports" @resolve-report="handleResolveReport" />
  
      <!-- Message si aucun signalement après chargement -->
       <div v-else class="no-reports-message">
          Aucun signalement trouvé pour le filtre "{{ currentStatusFilter || 'Tous' }}".
       </div>
  
  
       <!-- Zone pour la Pagination -->
       <div class="pagination-section" v-if="totalPages > 1">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1 || loading" class="pagination-button">
              Précédent
          </button>
          <span class="pagination-info">
              Page {{ currentPage }} sur {{ totalPages }}
          </span>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages || loading" class="pagination-button">
              Suivant
          </button>
       </div>
  
    </div>
  </template>
  
<script setup>
  import { ref, onMounted, reactive, watch } from 'vue';
  import ReportList from '@/components/admin/ReportList.vue';
  import { getAdminAuthToken } from '@/utils/adminAuth';
  
  const reports = ref([]);
  const loading = ref(true);
  const error = ref('');
  
  // --- État Pagination/Filtres ---
  const currentPage = ref(1);
  const totalPages = ref(1);
  const limit = ref(10);
  const currentStatusFilter = ref('pending'); // Défaut
  const totalReports = ref(0);
  
  // --- URL API ---
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  
  // --- Fonction Fetch API avec Vérifications ---
  const fetchReports = async () => {
      console.log('[AdminReports] Début fetchReports. Loading:', loading.value, 'Current Filter:', currentStatusFilter.value, 'Page:', currentPage.value);
      loading.value = true; // Indique le début du chargement
      error.value = '';     // Réinitialise l'erreur à chaque tentative
      const token = getAdminAuthToken();
  
      if (!token) {
          error.value = "Authentification Admin requise.";
          loading.value = false;
          reports.value = [];
          console.error("[AdminReports] Erreur: Token Admin manquant.");
          return;
      }
  
      // Construire l'URL avec query params
      const params = new URLSearchParams({
          page: currentPage.value,
          limit: limit.value,
      });
      if (currentStatusFilter.value) {
          params.append('status', currentStatusFilter.value);
      }
      const url = `${API_BASE_URL}/reports?${params.toString()}`;
  
      console.log(`[AdminReports] Fetching reports depuis: ${url}`);
      try {
          const response = await fetch(url, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          console.log(`[AdminReports] Réponse Status: ${response.status}`);
  
  
          // ===> VÉRIFICATION 1: Statut de la Réponse <===
          if (!response.ok) {
              let errorMsg = `Erreur ${response.status}`;
              let errorData = null;
              try {
                   errorData = await response.json(); // Essayer de lire le corps de l'erreur
                   errorMsg = errorData.message || errorMsg;
                   console.error("[AdminReports] Erreur API (JSON lu):", errorData);
              } catch(e){
                   console.error("[AdminReports] Erreur API (Réponse non-JSON ou autre problème):", await response.text());
              }
              throw new Error(errorMsg); // Lève une erreur qui sera attrapée par le bloc catch
          }
  
          // Si response.ok est true, on continue
          const result = await response.json();
          console.log("[AdminReports] Réponse API parsée:", JSON.stringify(result, null, 2)); // Log détaillé
  
          // ===> VÉRIFICATION 2: Structure de la Réponse <===
          if (result.status === 'success' && Array.isArray(result.data?.reports)) {
              // Assignation des données
              reports.value = result.data.reports;
              totalPages.value = result.totalPages || 1;
              currentPage.value = result.currentPage || 1;
              totalReports.value = result.totalReports || 0;
              console.log(`[AdminReports] Chargé ${reports.value.length} rapports. Page ${currentPage.value}/${totalPages.value}. Total: ${totalReports.value}.`);
  
              // ===> VÉRIFICATION 3: Données après assignation (pour déboguer réactivité) <===
              console.log('[AdminReports] reports.value après assignation:', JSON.stringify(reports.value));
  
          } else {
              // La structure n'est pas celle attendue
              console.error("[AdminReports] Structure de réponse API inattendue:", result);
              throw new Error("Format de réponse API invalide pour les signalements.");
          }
      } catch (err) {
          // Attrape les erreurs de fetch, response.ok false, ou structure invalide
          console.error("[AdminReports] Erreur dans le bloc try/catch de fetchReports:", err);
          error.value = err.message || "Impossible de charger les signalements.";
          reports.value = []; // Vider en cas d'erreur
          totalPages.value = 1;
          currentPage.value = 1;
          totalReports.value = 0;
      } finally {
           // ===> VÉRIFICATION 4: Exécution de finally et état de loading <===
          console.log('[AdminReports] Exécution du bloc finally. isLoading avant:', loading.value);
          loading.value = false; // Indique la fin du chargement
          console.log('[AdminReports] Exécution du bloc finally. isLoading après:', loading.value);
      }
  };
  
  // --- Fonction de Résolution (Appel API PATCH) ---
  const handleResolveReport = async (reportId, action) => {
      // ... (logique existante avec prompt, switch, etc.) ...
      const token = getAdminAuthToken();
      if(!token) { error.value = "Auth requise."; return; }
  
      let newStatus = '';
      let resolutionNote = '';
      // ... (logique switch/prompt pour définir newStatus et resolutionNote) ...
       switch (action) { /* ... comme avant ... */ }
       if (!newStatus) return; // Si action inconnue ou annulée
  
      const resolveUrl = `${API_BASE_URL}/reports/${reportId}`;
      console.log(`[AdminReports] Sending PATCH to ${resolveUrl}`);
      // loading.value = true; // Optionnel: réactiver loading pendant la résolution
      error.value = '';
  
      try {
          const response = await fetch(resolveUrl, {
              method: 'PATCH',
              headers: { /* ... vos headers ... */ },
              body: JSON.stringify({ status: newStatus, resolution: resolutionNote.trim() })
          });
  
          console.log(`[AdminReports Resolve] Réponse Status: ${response.status}`);
          if (!response.ok) { /* ... gestion erreur fetch ... */ throw new Error(`Erreur ${response.status}`); }
  
          const result = await response.json();
          console.log(`Signalement ${reportId} mis à jour avec succès:`, result.data?.report);
          alert(`Signalement marqué comme ${newStatus}.`);
  
          // ===> VÉRIFICATION 5: Rechargement après résolution <===
          console.log("[AdminReports Resolve] Rafraîchissement de la liste...");
          await fetchReports(); // Recharger pour voir le changement
  
      } catch(err) { /* ... gestion erreur ... */ }
      // finally { loading.value = false; } // si loading est activé au début
  };
  
  // --- Fonctions UI (Pagination, Filtre) ---
  const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value && page !== currentPage.value && !loading.value) { // Ajout !loading
          currentPage.value = page;
          fetchReports();
      }
  };
  
  const applyFilter = () => {
      if (loading.value) return; // Empêche filtre pendant chargement
      currentPage.value = 1;
      fetchReports();
  };
  
  // Charger initialement
  onMounted(() => {
      console.log("[AdminReports] Composant monté, lancement initial de fetchReports.");
      fetchReports();
  });
</script>
  
  <style scoped>
  /* Styles généraux pour la page */
  .admin-reports-page {
    /* ... */
  }
  .page-title {
    font-size: 1.875rem; line-height: 2.25rem; font-weight: 600;
    margin-bottom: 1.5rem; color: #ffffff;
  }
  .page-description {
    color: #9ca3af; margin-bottom: 1.5rem;
  }
  
  /* Section Filtres */
  .filters-section {
    margin-bottom: 1rem; padding: 0.75rem; background-color: #1f2937;
    border-radius: 0.375rem; border: 1px solid #374151;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .filter-label {
      font-size: 0.875rem;
      color: #d1d5db;
  }
  .filter-select {
      padding: 0.3rem 0.6rem;
      border-radius: 0.25rem;
      background-color: #374151;
      color: #e5e7eb;
      border: 1px solid #4b5563;
      font-size: 0.875rem;
  }
  
  /* Messages Loading/Error/Empty */
  .loading-message, .no-reports-message {
    text-align: center; padding: 2.5rem 0; color: #9ca3af; font-style: italic;
  }
  .loading-message i { margin-right: 0.5rem; }
  .error-message {
    background-color: #450a0a; border: 1px solid #7f1d1d; color: #fecaca;
    padding: 0.75rem 1rem; border-radius: 0.25rem; margin-bottom: 1rem;
  }
  .error-message strong { font-weight: 700; margin-right: 0.5rem; }
  .retry-button.small { /* Style du bouton réessayer */
      font-size: 0.8em; padding: 2px 6px; margin-left: 10px;
      background-color: #7f1d1d; border: none; color: white; border-radius: 3px; cursor: pointer;
  }
  
  /* Section Pagination */
  .pagination-section {
    margin-top: 1.5rem; padding: 0.75rem 0; text-align: center;
    border-top: 1px solid #374151;
    display: flex; justify-content: center; align-items: center; gap: 1rem;
  }
  .pagination-info {
      font-size: 0.875rem;
      color: #9ca3af;
  }
  .pagination-button {
      padding: 0.3rem 0.8rem;
      border-radius: 0.25rem;
      background-color: #374151;
      color: #e5e7eb;
      border: 1px solid #4b5563;
      cursor: pointer;
      transition: background-color 0.2s ease;
  }
  .pagination-button:hover:not(:disabled) {
      background-color: #4b5563;
  }
  .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
  }
  
  /* La liste elle-même est gérée par le composant ReportList */
  
  </style>