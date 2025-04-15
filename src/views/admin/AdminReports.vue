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
  import { ref, onMounted, reactive, watch } from 'vue'; // Ajout de reactive et watch
  import ReportList from '@/components/admin/ReportList.vue';
  import { getAdminAuthToken } from '@/utils/adminAuth'; // Importer le helper pour le token
  
  // --- État ---
  const reports = ref([]);
  const loading = ref(true); // Indique un chargement en cours (pour toute la page/liste)
  const resolving = ref(false); // État spécifique pour indiquer qu'une résolution est en cours
  const error = ref('');
  
  // --- État Pagination/Filtres ---
  const currentPage = ref(1);
  const totalPages = ref(1);
  const limit = ref(10); // Nombre de signalements par page
  const currentStatusFilter = ref('pending'); // Filtrer par 'pending' par défaut
  const totalReports = ref(0); // Optionnel: pour afficher le nombre total
  
  // --- URL API ---
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app/api';
  // URL base Admin (adaptez si vos routes admin sont sous /api/admin)
  const API_ADMIN_BASE_URL = `${API_BASE_URL}/admin`; // Supposant un montage dédié
  
  // --- Fonction Fetch API ---
  const fetchReports = async () => {
      // Ne pas reset error ici si loading est juste pour le rafraichissement
      // On peut le faire seulement si ce n'est pas un re-fetch après action
      if (!resolving.value) { // N'affiche le loader principal que si ce n'est pas une résolution
           loading.value = true;
           error.value = ''; // Reset error seulement au chargement initial/filtre/page
      }
      const token = getAdminAuthToken();
  
      if (!token) {
          error.value = "Authentification Admin requise.";
          loading.value = false;
          reports.value = [];
          return;
      }
  
      // Construire l'URL avec les query params
      const params = new URLSearchParams({ page: currentPage.value, limit: limit.value });
      if (currentStatusFilter.value) params.append('status', currentStatusFilter.value);
      // Utilise l'endpoint admin GET /api/admin/reports
      const url = `${API_BASE_URL}/auth/reports?${params.toString()}`;
  
      console.log(`[AdminReports] Fetching reports from: ${url}`);
      try {
          const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
  
          // Vérification du statut
          if (!response.ok) {
              let errorMsg = `Erreur ${response.status}`;
              try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch(e){}
              throw new Error(errorMsg);
          }
  
          const result = await response.json();
          console.log("[AdminReports] Parsed API Response:", JSON.stringify(result, null, 2)); // Log détaillé
  
          // Vérification de la structure
          if (result.status === 'success' && Array.isArray(result.data?.reports)) {
              reports.value = result.data.reports;
              totalPages.value = result.totalPages || 1;
              currentPage.value = result.currentPage || 1;
              totalReports.value = result.totalReports || 0; // Assurez-vous que le backend renvoie ça
               console.log(`[AdminReports] Loaded ${reports.value.length} reports. Page ${currentPage.value}/${totalPages.value}. Total: ${totalReports.value}.`);
          } else {
              throw new Error("Format de réponse API invalide pour les signalements.");
          }
      } catch (err) {
          console.error("Erreur chargement signalements:", err);
          error.value = err.message || "Impossible de charger les signalements.";
          reports.value = []; // Vider en cas d'erreur
          totalPages.value = 1;
          currentPage.value = 1;
          totalReports.value = 0;
      } finally {
          loading.value = false; // Fin du chargement (qu'il soit initial ou rafraîchissement)
           console.log('[AdminReports] fetchReports finally block. Loading state:', loading.value);
      }
  };
  
  // --- Fonction de Résolution (Appel API PATCH) ---
  const handleResolveReport = async (reportId, action) => {
      if (resolving.value) return; // Empêche clics multiples pendant résolution
      resolving.value = true; // Indique qu'une résolution est en cours
      error.value = ''; // Reset l'erreur précédente
  
      const token = getAdminAuthToken();
      if(!token) {
          error.value = "Auth requise.";
          resolving.value = false;
          return;
      }
  
      let newStatus = '';
      let resolutionNote = '';
      let performActionApiCall = null;
      const report = reports.value.find(r => r.id === reportId); // Nécessaire pour récupérer IDs
  
      if (!report) {
          error.value = "Erreur: rapport non trouvé localement.";
          resolving.value = false;
          return;
      }
  
      // --- Logique de confirmation et préparation ---
      try {
          switch (action) {
              case 'dismiss':
                  if (!confirm("Vraiment rejeter ce signalement ?")) throw new Error("Action annulée par l'admin.");
                  newStatus = 'rejected';
                  resolutionNote = prompt("Raison du rejet (optionnel) :", "Signalement rejeté.") || 'Signalement rejeté.';
                  if (resolutionNote === null) throw new Error("Action annulée par l'admin."); // Annulé sur prompt
                  break;
              case 'delete_content':
              case 'ban_user':
                  const isDelete = action === 'delete_content';
                  const itemType = report.reportedVoiceNote ? 'voice-note' : (report.reportedComment ? 'comment' : null);
                  const itemId = report.reportedVoiceNote?.id || report.reportedComment?.id;
                  const authorId = report.reportedVoiceNote?.user?.id || report.reportedComment?.user?.id; // Nécessite include de user dans reportedItem
                  const actionText = isDelete ? 'supprimer le contenu' : `bloquer l'auteur (${authorId?.substring(0,8)}...)`;
  
                  if ((isDelete && (!itemId || !itemType)) || (!isDelete && !authorId)) {
                      throw new Error(`Impossible d'identifier ${isDelete ? 'le contenu' : 'l\'auteur'} à ${action}. Vérifiez les données du rapport.`);
                  }
                  if (!confirm(`Confirmez-vous de vouloir ${actionText} suite à ce signalement ?`)) throw new Error("Action annulée par l'admin.");
  
                  newStatus = 'resolved';
                  resolutionNote = prompt(`Note de résolution (action: ${action}) :`, `${isDelete ? 'Contenu' : 'Auteur'} ${actionText} suite au signalement.`);
                  if (!resolutionNote || resolutionNote.trim() === '') throw new Error("Note de résolution requise.");

                  // Préparer l'appel API d'action
                   if (isDelete) {
                       const deleteUrl = `${API_BASE_URL}/auth/content/${itemType}/${itemId}`;
                       performActionApiCall = async () => {
                           console.log(`Appel API suppression: DELETE ${deleteUrl}`);
                           const r = await fetch(deleteUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                           if (!r.ok) { const d = await r.json().catch(()=>({})); throw new Error(`Erreur ${r.status} suppression contenu: ${d.message || r.statusText}`); }
                       };
                   } else { // Ban user
                      // Assurer que l'admin ne se bloque pas
                      const currentAdminId = localStorage.getItem('userId'); // Ou via store/props
                      if (authorId === currentAdminId) throw new Error("Impossible de bloquer cet utilisateur.");
  
                       const blockUrl = `${API_BASE_URL}/auth/users/${authorId}/status`;
                       performActionApiCall = async () => {
                            console.log(`Appel API blocage: PATCH ${blockUrl}`);
                           const r = await fetch(blockUrl, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}, body: JSON.stringify({ isActive: false }) });
                           if (!r.ok) { const d = await r.json().catch(()=>({})); throw new Error(`Erreur ${r.status} blocage user: ${d.message || r.statusText}`); }
                       };
                   }
                  break;
              default:
                  throw new Error(`Action inconnue: ${action}`);
          }
      } catch (userCancelOrSetupError) {
           // Erreur venant d'un confirm/prompt annulé ou d'un setup invalide
           console.log("Résolution annulée ou erreur de préparation:", userCancelOrSetupError.message);
           error.value = userCancelOrSetupError.message.includes("annulée") ? '' : userCancelOrSetupError.message; // Ne pas montrer d'erreur si juste annulé
           resolving.value = false;
           return;
      }
  
  
      // -- Appels API --
      const resolveUrl = `${API_BASE_URL}/auth/reports/${reportId}`; // Utilise PATCH /api/reports/:id
      console.log(`[AdminReports] Sending PATCH to ${resolveUrl} with status: ${newStatus}`);
  
      try {
          // --- Étape 1: Exécuter l'action (delete/ban) si nécessaire ---
          if (performActionApiCall) {
              await performActionApiCall();
               console.log(`[AdminReports] Action ${action} exécutée avec succès.`);
          }
  
          // --- Étape 2: Mettre à jour le statut du rapport ---
          const response = await fetch(resolveUrl, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ status: newStatus, resolution: resolutionNote.trim() })
          });
  
          if (!response.ok) {
               let errorMsg = `Erreur MàJ rapport (${response.status})`;
               try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch(e){}
               throw new Error(errorMsg);
          }
  
          const result = await response.json();
          console.log(`Signalement ${reportId} mis à jour:`, result.data?.report);
          alert(`Signalement marqué comme ${newStatus}.`);
  
          // Recharger la liste pour refléter le changement
          await fetchReports();
  
      } catch (err) {
          console.error(`Erreur résolution signalement ${reportId} (action: ${action}):`, err);
          error.value = `Erreur résolution: ${err.message}`;
          // Remarque: Pas d'annulation optimiste ici, on recharge juste.
      } finally {
          resolving.value = false; // Fin de l'action de résolution
      }
  };
  // --- FIN Fonction de Résolution ---
  
  // --- Fonctions UI (Pagination, Filtre) ---
  const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value && page !== currentPage.value && !loading.value && !resolving.value) { // Bloque si chargement OU résolution en cours
          currentPage.value = page;
          fetchReports();
      }
  };
  
  const applyFilter = () => {
      if (loading.value || resolving.value) return; // Bloque si chargement OU résolution en cours
      currentPage.value = 1;
      fetchReports();
  };
  
  // Charger initialement
  onMounted(() => {
      console.log("[AdminReports] Composant monté, lancement initial de fetchReports.");
      if (getAdminAuthToken()) {
           fetchReports();
      } else {
          error.value = "Accès Admin requis.";
          loading.value = false;
      }
  });
</script>
  

  <style scoped>
  /* Styles généraux pour la page */
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