<template>
  <!-- Conteneur principal avec styles de base -->
  <div class="user-data-table">
    <table>
      <thead>
        <tr>
          <!-- En-têtes de colonnes -->
          <th>Utilisateur</th>
          <th>Email</th>
          <th>Inscrit le</th>
          <th>Statut</th>
          <th class="actions-header">Actions</th> <!-- Classe pour alignement -->
        </tr>
      </thead>
      <tbody>
        <!-- Message si aucun utilisateur -->
        <tr v-if="users.length === 0" class="no-users-row">
          <td colspan="5">Aucun utilisateur trouvé.</td>
        </tr>
        <!-- Lignes pour chaque utilisateur -->
        <tr v-for="user in users" :key="user.id" class="user-row">
          <!-- Cellule Utilisateur (avec avatar) -->
          <td class="user-cell">
            <div class="user-info-wrapper">
              <div class="avatar-wrapper">
                <img class="avatar-img" :src="getUserAvatar(user.avatar)" :alt="user.username">
              </div>
              <div class="user-details">
                <div class="username">{{ user.username }}</div>
                <div class="user-id">ID: {{ user.id.substring(0, 8) }}...</div>
              </div>
            </div>
          </td>
          <!-- Cellule Email -->
          <td class="email-cell">{{ user.email }}</td>
          <!-- Cellule Date d'inscription -->
          <td class="date-cell">{{ formatDateTime(user.createdAt) }}</td>
          <!-- Cellule Statut -->
          <td class="status-cell">
            <!-- Badge de statut avec classe conditionnelle -->
            <span class="status-badge" :class="user.isActive ? 'status-active' : 'status-blocked'">
              {{ user.isActive ? 'Actif' : 'Bloqué' }}
            </span>
          </td>
          <!-- Cellule Actions -->
          <td class="actions-cell">
            <!-- Boutons d'action conditionnels -->
            <button v-if="user.isActive" @click="$emit('block-user', user.id)" class="action-button block-button" title="Bloquer">Bloquer</button>
            <button v-else @click="$emit('unblock-user', user.id)" class="action-button unblock-button" title="Débloquer">Débloquer</button>
            <!-- Autres boutons (ex: Voir Détails) -->
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
  
<script setup>
  defineProps({
    users: { type: Array, default: () => [] }
  });
  defineEmits(['block-user', 'unblock-user']);
  
  // Fonctions Helper (à déplacer/importer si utilisées ailleurs)
  const getUserAvatar = (avatarPath) => {
      const placeholder = 'https://via.placeholder.com/40?text=?';
      if (!avatarPath) return placeholder;
      if (avatarPath.startsWith('http')) return avatarPath;
      // Assumer que apiUrlBase est disponible globalement ou via import/prop
      const apiUrlBase = import.meta.env.VITE_API_URL_BASE || 'http://localhost:5000';
      try { return new URL(avatarPath, apiUrlBase).href; } catch (e) { return placeholder; }
  };
  
  const formatDateTime = (isoString) => {
      if (!isoString) return '-';
      try {
          // Format plus lisible jj/mm/aaaa
          return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) { return 'Date invalide'; }
  };
  </script>
  
<style scoped>
  /* Conteneur principal de la table */
  .user-data-table {
    background-color: #1f2937; /* Correspond à bg-gray-800 */
    color: #d1d5db; /* Couleur texte par défaut (gris clair) */
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* Correspond à shadow-lg */
    border-radius: 0.5rem; /* Correspond à rounded-lg */
    overflow: hidden; /* Empêche le contenu de déborder des coins arrondis */
  }
  
  /* Style de la table */
  table {
    min-width: 100%; /* Correspond à min-w-full */
    width: 100%;
    border-collapse: collapse; /* Pour que les bordures entre cellules fonctionnent bien */
  }
  
  /* Style de l'en-tête */
  thead {
    background-color: #374151; /* Correspond à bg-gray-700 */
  }
  
  th {
    padding: 0.75rem 1.5rem; /* Correspond à px-6 py-3 */
    text-align: left;
    font-size: 0.75rem; /* Correspond à text-xs */
    line-height: 1rem;
    font-weight: 500; /* Correspond à font-medium */
    color: #d1d5db; /* Correspond à text-gray-300 */
    text-transform: uppercase;
    letter-spacing: 0.05em; /* Correspond à tracking-wider */
    white-space: nowrap; /* Empêche le retour à la ligne */
  }
  
  /* Style du corps de la table */
  tbody {
    /* Ligne de séparation entre les lignes */
    border-color: #374151; /* Correspond à divide-gray-700 */
    border-style: solid;
    border-width: 0; /* Appliqué via border-top sur les 'tr' */
  }
  
  /* Style de chaque ligne utilisateur */
  .user-row {
     border-top-width: 1px; /* Simule divide-y */
     transition: background-color 0.15s ease-in-out; /* Pour le survol */
  }
  /* Style au survol */
  .user-row:hover {
     background-color: #374151; /* Correspond à hover:bg-gray-750 (ajusté) */
  }
  
  /* Style des cellules */
  td {
    padding: 1rem 1.5rem; /* Correspond à px-6 py-4 */
    white-space: nowrap; /* Correspond à whitespace-nowrap */
    vertical-align: middle; /* Centre verticalement le contenu */
  }
  
  /* Style spécifique pour la cellule "Aucun utilisateur" */
  .no-users-row td {
    text-align: center;
    color: #6b7280; /* Correspond à text-gray-500 */
    font-style: italic;
  }
  
  /* Style pour la cellule Utilisateur (avatar + nom) */
  .user-cell .user-info-wrapper {
    display: flex;
    align-items: center;
  }
  .user-cell .avatar-wrapper {
    flex-shrink: 0; /* Empêche l'avatar de rétrécir */
    height: 2.5rem; /* Correspond à h-10 */
    width: 2.5rem; /* Correspond à w-10 */
  }
  .user-cell .avatar-img {
    height: 100%;
    width: 100%;
    border-radius: 9999px; /* Correspond à rounded-full */
    object-fit: cover; /* Evite la déformation */
    background-color: #4b5563; /* Fond si l'image ne charge pas */
  }
  .user-cell .user-details {
    margin-left: 1rem; /* Correspond à ml-4 */
  }
  .user-cell .username {
    font-size: 0.875rem; /* Correspond à text-sm */
    line-height: 1.25rem;
    font-weight: 500; /* Correspond à font-medium */
    color: #ffffff; /* Correspond à text-white */
  }
  .user-cell .user-id {
    font-size: 0.75rem; /* Correspond à text-xs */
    line-height: 1rem;
    color: #9ca3af; /* Correspond à text-gray-400 */
  }
  
  /* Style pour la cellule Email */
  .email-cell {
    font-size: 0.875rem; /* Correspond à text-sm */
    color: #d1d5db; /* Correspond à text-gray-300 */
  }
  
  /* Style pour la cellule Date */
  .date-cell {
    font-size: 0.875rem; /* Correspond à text-sm */
    color: #9ca3af; /* Correspond à text-gray-400 */
  }
  
  /* Style pour la cellule Statut */
  .status-cell {
    /* Pas de style spécifique nécessaire pour la cellule elle-même */
  }
  .status-badge {
    padding-left: 0.5rem; /* Correspond à px-2 */
    padding-right: 0.5rem;
    display: inline-flex; /* Correspond à inline-flex */
    font-size: 0.75rem; /* Correspond à text-xs */
    line-height: 1.25rem; /* Correspond à leading-5 */
    font-weight: 600; /* Correspond à font-semibold */
    border-radius: 9999px; /* Correspond à rounded-full */
  }
  .status-active {
     background-color: #065f46; /* Correspond à bg-green-800 */
     color: #a7f3d0; /* Correspond à text-green-200 */
  }
  .status-blocked {
     background-color: #991b1b; /* Correspond à bg-red-800 */
     color: #fecaca; /* Correspond à text-red-200 */
  }
  
  /* Style pour la cellule Actions */
  .actions-cell {
    text-align: right; /* Correspond à text-right */
  }
  .actions-cell .action-button {
    font-size: 0.875rem; /* Correspond à text-sm */
    font-weight: 500; /* Correspond à font-medium */
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem; /* Ajoute un peu de padding */
    transition: color 0.2s ease;
    margin-left: 0.5rem; /* Simule space-x-2 */
  }
  .actions-cell .action-button:first-child {
      margin-left: 0;
  }
  
  .action-button.block-button {
     color: #f87171; /* Correspond à text-red-400 */
  }
  .action-button.block-button:hover {
     color: #fca5a5; /* Correspond à hover:text-red-300 */
  }
  .action-button.unblock-button {
     color: #4ade80; /* Correspond à text-green-400 */
  }
  .action-button.unblock-button:hover {
     color: #86efac; /* Correspond à hover:text-green-300 */
  }
  
  /* Style pour aligner l'en-tête "Actions" à droite */
  th.actions-header {
    text-align: right;
    padding-right: 1.5rem; /* px-6 */
  }
  
</style>