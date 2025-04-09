<template>
  <div class="report-list"> <!-- Classe principale pour espacement -->
    <div v-if="!reports || reports.length === 0" class="no-reports-message"> <!-- Vérifie aussi !reports -->
      Aucun signalement à traiter.
    </div>
    <!-- Itération sur les signalements -->
    <div v-else v-for="report in reports" :key="report.id" class="report-item">
        <!-- Section Infos Signalement -->
        <div class="report-info">
            <!-- Date et Rapporteur -->
            <div class="report-meta">
                Signalé le: {{ formatDateTime(report.createdAt) }} par
                <!-- MODIFIÉ: Utilise l'alias 'reporter' de l'include backend -->
                <span class="reporter-name">{{ report.reporter?.username || 'Utilisateur inconnu' }}</span>
            </div>
            <!-- Type et ID de l'élément signalé -->
            <p class="report-target">
                <span class="label">Type:</span>
                <!-- MODIFIÉ: Détermine le type basé sur l'objet associé présent -->
                <span v-if="report.reportedVoiceNote">Note Vocale</span>
                <!-- Ajoutez d'autres types si vous signalez autre chose -->
                <!-- <span v-else-if="report.reportedComment">Commentaire</span> -->
                <span v-else>Contenu Inconnu</span>

                <!-- MODIFIÉ: Accède à l'ID via l'objet associé et ajoute la sécurité -->
                (<span class="target-id">ID:
                  {{ report.reportedVoiceNote?.id?.substring(0,8) || report.reportedComment?.id?.substring(0,8) || 'N/A' }}...
                </span>)
            </p>
            <!-- Raison du signalement -->
            <p class="report-reason">
                <span class="label">Raison:</span> {{ report.reason || 'Non spécifiée' }}
            </p>
            <!-- Lien pour voir le contenu -->
            <a href="#" @click.prevent="viewReportedContent(report)" class="view-content-link">Voir le contenu</a>
            <!-- TODO: Implémenter la logique pour afficher le contenu signalé (modal?) -->
        </div>

         <!-- Section Actions Admin -->
        <div class="report-actions">
            <button @click="$emit('resolve-report', report.id, 'dismiss')" class="action-button dismiss-button">Rejeter</button>
            <button @click="$emit('resolve-report', report.id, 'delete_content')" class="action-button delete-button">Suppr. Contenu</button>
            <!-- MODIFIÉ: Clarification texte bouton -->
            <button @click="$emit('resolve-report', report.id, 'ban_user')" class="action-button ban-button">Bloquer Auteur Contenu</button>
        </div>
    </div>
  </div>
</template>

  <script setup>
  defineProps({
    reports: { type: Array, default: () => [] }
  });
  defineEmits(['resolve-report']);
  
  const formatDateTime = (isoString) => {
      if (!isoString) return '-';
      try { return new Date(isoString).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); } // Format plus court
      catch (e) { return 'Date invalide'; }
  };
  
  const viewReportedContent = (report) => {
      // TODO: Implémenter la logique pour afficher le contenu
      alert(`Affichage du contenu signalé ${report.reportedItemType} ID: ${report.reportedItemId} (non implémenté)`);
  };
</script>

<style scoped>
  /* Conteneur principal de la liste */
  .report-list {
    display: flex;
    flex-direction: column;
    gap: 1rem; /* Correspond à space-y-4 */
  }
  
  /* Message si aucun signalement */
  .no-reports-message {
    text-align: center;
    padding: 2.5rem 0; /* Correspond à py-10 */
    color: #6b7280; /* Correspond à text-gray-500 */
    font-style: italic;
  }
  
  /* Style pour chaque élément de signalement */
  .report-item {
    background-color: #1f2937; /* Correspond à bg-gray-800 */
    padding: 1rem; /* Correspond à p-4 */
    border-radius: 0.5rem; /* Correspond à rounded-lg */
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* Correspond à shadow-md */
    display: flex;
    flex-direction: column; /* Par défaut pour mobile */
    gap: 1rem; /* Correspond à gap-4 */
  }
  
  /* Adapte en ligne sur écrans plus larges */
  @media (min-width: 640px) { /* Correspond à sm: */
    .report-item {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  /* Conteneur pour les informations du signalement */
  .report-info {
    flex-grow: 1; /* Prend l'espace disponible */
  }
  
  /* Style pour les métadonnées (date, rapporteur) */
  .report-meta {
    font-size: 0.75rem; /* Correspond à text-xs */
    color: #9ca3af; /* Correspond à text-gray-400 */
    margin-bottom: 0.25rem; /* Correspond à mb-1 */
  }
  .reporter-name {
    font-weight: 500; /* Correspond à font-medium */
    color: #d1d5db; /* Correspond à text-gray-300 */
  }
  
  /* Style pour le type d'élément signalé */
  .report-target {
    font-size: 0.875rem; /* Correspond à text-sm */
    color: #d1d5db; /* Correspond à text-gray-300 */
    margin-bottom: 0.25rem; /* Correspond à mb-1 */
  }
  .label { /* Style commun pour les labels "Type:", "Raison:" */
     font-weight: 600; /* Correspond à font-semibold */
     color: #9ca3af; /* Couleur du label */
  }
  .target-id { /* Style spécifique pour l'ID */
    font-family: monospace; /* Correspond à font-mono */
    font-size: 0.75rem; /* Correspond à text-xs */
  }
  
  /* Style pour la raison du signalement */
  .report-reason {
    font-size: 0.875rem; /* Correspond à text-sm */
    color: #e5e7eb; /* Correspond à text-gray-200 */
    margin-bottom: 0.5rem; /* Correspond à mb-2 */
  }
  
  /* Style pour le lien "Voir le contenu" */
  .view-content-link {
    color: #60a5fa; /* Correspond à text-blue-400 */
    font-size: 0.875rem; /* Correspond à text-sm */
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .view-content-link:hover {
    color: #93c5fd; /* Correspond à hover:text-blue-300 */
    text-decoration: underline;
  }
  
  /* Conteneur pour les boutons d'action */
  .report-actions {
    display: flex;
    flex-shrink: 0; /* Empêche de rétrécir */
    gap: 0.5rem; /* Correspond à gap-2 */
    flex-wrap: wrap; /* Permet le retour à la ligne sur petit écran */
    justify-content: flex-end; /* Aligne à droite sur grand écran */
  }
  
  /* Style commun aux boutons d'action */
  .action-button {
    padding-left: 0.75rem; /* Correspond à px-3 */
    padding-right: 0.75rem;
    padding-top: 0.25rem; /* Correspond à py-1 */
    padding-bottom: 0.25rem;
    font-size: 0.75rem; /* Correspond à text-xs */
    font-weight: 500; /* Correspond à font-medium */
    border-radius: 0.25rem; /* Correspond à rounded */
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap; /* Empêche le texte du bouton de passer à la ligne */
  }
  
  /* Couleurs spécifiques des boutons */
  .dismiss-button {
    background-color: #4b5563; /* Correspond à bg-gray-600 */
  }
  .dismiss-button:hover {
    background-color: #6b7280; /* Correspond à hover:bg-gray-500 */
  }
  
  .delete-button {
    background-color: #d97706; /* Correspond à bg-yellow-600 */
  }
  .delete-button:hover {
     background-color: #f59e0b; /* Correspond à hover:bg-yellow-500 */
  }
  
  .ban-button {
    background-color: #dc2626; /* Correspond à bg-red-600 */
  }
  .ban-button:hover {
     background-color: #ef4444; /* Correspond à hover:bg-red-500 */
  }
</style>