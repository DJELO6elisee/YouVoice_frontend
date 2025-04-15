<template>
    <!-- Overlay et Sidebar principale -->
    <div class="sidebar-overlay" :class="{ 'is-open': isSidebarOpen }" @click="closeSidebar"></div>
    <aside class="sidebar" :class="{ 'is-open': isSidebarOpen }">
        <button class="close-sidebar-button" @click="closeSidebar" title="Fermer le menu">×</button>
  
        <!-- Profil utilisateur -->
        <div v-if="isLoadingProfile" class="user-profile-link user-profile loading">
              Chargement...
        </div>
        <div v-else-if="profileError" class="user-profile-link user-profile error">
              {{ profileError }}
              <button @click="fetchUserProfile" class="retry-button">Réessayer</button>
        </div>
        <router-link v-else :to="{ name: 'UserProfile' }" class="user-profile-link">
              <div class="user-profile">
                   <img :src="userAvatarUrl" alt="User Avatar" class="avatar" />
                   <div class="user-info">
                     <span class="name">{{ userName || 'Utilisateur' }}</span>
                     <span class="email">{{ userEmail || 'Email non disponible' }}</span>
                   </div>
              </div>
        </router-link>
  
        <!-- Bouton Publier -->
        <button @click="requestShowRecorderAndClose" class="publish-button">+ Publier une Note Vocale</button>
  
        <!-- Navigation Principale -->
        <nav class="main-nav">
            <router-link to="/dashboard" class="nav-item" active-class="active" @click="closeSidebar">
                <span class="icon"><i class="fa-solid fa-house"></i></span>
                Accueil
            </router-link>
            <router-link to="/tableau-de-bord" class="nav-item" active-class="active" @click="closeSidebar">
                 <span class="icon"><i class="fa-solid fa-table-columns"></i></span>
                 Tableau de Bord
            </router-link>
            <router-link to="/historique" class="nav-item" active-class="active" @click="closeSidebar">
                 <span class="icon"><i class="fa-solid fa-clock-rotate-left"></i></span>
                 Historique
            </router-link>
        </nav>
  
        <div class="separator"></div>
  
        <!-- Navigation Secondaire -->
        <nav class="secondary-nav">
            <!-- Bouton Notifications (modifié) -->
            <button class="nav-item notification-trigger" @click.stop="toggleNotificationsPopover">
                 <span class="icon"><i class="fa-solid fa-bell"></i></span>
                 Notifications
                 <!-- Badge mis à jour avec le compteur de non lues -->
                 <span v-if="unreadNotificationCount > 0" class="badge">{{ unreadNotificationCount }}</span>
            </button>
  
            <router-link to="/profil" class="nav-item" active-class="active" @click="closeSidebar">
                 <span class="icon"><i class="fa-solid fa-user"></i></span>
                 Profil
            </router-link>
            <button @click="handleLogoutAndClose" class="nav-item logout-button">
                <span class="icon"><i class="fa-solid fa-right-from-bracket"></i></span>
                Deconnexion
            </button>
        </nav>
  
        <!-- Popover des Notifications -->
         <div v-if="isNotificationsPopoverVisible" class="notifications-popover">
              <div class="popover-header">
                  <h3>Notifications</h3>
                   <button
                      v-if="unreadNotificationCount > 0"
                      @click="markAllNotificationsAsRead"
                      class="mark-read-button"
                      :disabled="isLoadingNotifications"
                      title="Marquer tout comme lu">
                      Tous marqué comme lu
                   </button>
              </div>
                <div class="popover-body">
                  <div v-if="isLoadingNotifications" class="loading-message popover-loading">
                       <i class="fa-solid fa-spinner fa-spin"></i> Chargement...
                  </div>
                  <div v-else-if="notificationsError" class="error-message popover-error">
                      <i class="fa-solid fa-circle-exclamation"></i> {{ notificationsError }}
                      <button @click="fetchNotifications" class="retry-button small">Réessayer</button>
                  </div>
                  <div v-else-if="notifications.length === 0" class="empty-message">
                      Aucune notification. <!-- Message mis à jour -->
                  </div>
                  <!-- Liste des notifications -->
                  <ul v-else class="notifications-list">
                       <!-- MODIFIÉ: Ajout de :class et @click sur li -->
                       <li v-for="notification in notifications"
                           :key="notification.id"
                           class="notification-item"
                           :class="{ 'is-read': notification.read }"
                           @click="markOneAsRead(notification)"
                           title="Marquer comme lu/non lu"> <!-- Texte indicatif -->
  
                            <!-- Icône basée sur le type -->
                            <div class="notification-icon">
                               <i v-if="notification.type === 'like'" class="fa-solid fa-heart liked" title="Nouveau j'aime"></i>
                               <i v-else-if="notification.type === 'comment'" class="fa-solid fa-comment" title="Nouveau commentaire"></i>
                               <i v-else-if="notification.type === 'share'" class="fa-solid fa-share-nodes" title="Nouveau partage"></i>
                               <i v-else class="fa-solid fa-info-circle" title="Notification"></i>
                            </div>
                            <!-- Contenu texte -->
                            <div class="notification-content">
                               <p class="notification-text">
                                 <span class="actor-name">{{ notification.actor?.username || 'Quelqu\'un' }}</span>
                                 <!-- Texte dynamique -->
                                 <template v-if="notification.type === 'like'"> a aimé votre note vocale.</template>
                                 <template v-else-if="notification.type === 'comment'"> a commenté votre note vocale.</template>
                                 <template v-else-if="notification.type === 'share'"> a partagé votre note vocale.</template>
                                 <template v-else> a interagi avec vous.</template>
                               </p>
                               <span class="notification-timestamp">{{ formatRelativeTime(notification.createdAt) }}</span>
                            </div>
                            <!-- Avatar de l'acteur -->
                            <img v-if="notification.actor?.avatar" :src="getActorAvatarUrl(notification.actor.avatar)" alt="Avatar" class="actor-avatar"/>
                            <div v-else class="actor-avatar placeholder">?</div>
                        </li>
                    </ul>
                </div>
           </div>
        <!-- FIN Popover -->
  
    </aside>
</template>
  
<script setup>
  import { useRouter } from 'vue-router';
  import { ref, onMounted, computed, defineEmits, defineExpose } from 'vue';
  
  const emit = defineEmits(['show-recorder']);
  const router = useRouter();
  
  // --- URLs de l'API ---
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app/api';
  const apiUrlBase = import.meta.env.VITE_API_URL_BASE || 'https://youvoiceapi-production.up.railway.app';
  
  // --- État Sidebar ---
  const isSidebarOpen = ref(false);
  
  // --- Infos Utilisateur ---
  const userName = ref('');
  const userEmail = ref('');
  const userAvatarPath = ref('');
  const isLoadingProfile = ref(true);
  const profileError = ref('');
  
  // --- État pour les Notifications ---
  const isNotificationsPopoverVisible = ref(false);
  const notifications = ref([]); // Stocke toutes les notifs récentes (lues et non lues)
  const isLoadingNotifications = ref(false);
  const notificationsError = ref('');
  
  // --- Propriété Calculée Avatar Utilisateur ---
  const userAvatarUrl = computed(() => {
    const placeholder = 'https://via.placeholder.com/40?text=?';
    const avatarPath = userAvatarPath.value;
    if (!avatarPath) { return placeholder; }
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) { return avatarPath; }
    if (!apiUrlBase) { console.warn("[Sidebar Avatar] apiUrlBase n'est pas défini."); return placeholder; }
    try { return new URL(avatarPath, apiUrlBase).href; }
    catch (e) { console.error(`[Sidebar Avatar] Erreur construction URL:`, e); return placeholder; }
  });
  
  // --- Compteur pour le Badge (basé sur l'état 'read') ---
  const unreadNotificationCount = computed(() => {
      return notifications.value.filter(n => !n.read).length;
  });
  
  // --- FONCTIONS HELPER ---
  const getAuthToken = () => localStorage.getItem('authToken');
  
  // --- Fonctions Sidebar ---
  const openSidebar = () => {
      isSidebarOpen.value = true;
      document.body.classList.add('sidebar-open-no-scroll');
  };
  const closeSidebar = () => {
      isSidebarOpen.value = false;
      isNotificationsPopoverVisible.value = false; // Ferme aussi le popover notifs
      document.body.classList.remove('sidebar-open-no-scroll');
  };
  const toggleSidebar = () => {
      if (isSidebarOpen.value) { closeSidebar(); } else { openSidebar(); }
  };
  
  // --- Expose ---
  defineExpose({ openSidebar, closeSidebar, toggleSidebar });
  
  // --- Déconnexion ---
  const handleLogoutAndClose = () => { handleLogout(); closeSidebar(); };
  const handleLogout = () => {
      console.log('Déconnexion initiée...');
      localStorage.removeItem('authToken'); localStorage.removeItem('userId');
      userName.value = ''; userEmail.value = ''; userAvatarPath.value = ''; profileError.value = '';
      console.log('Token et infos utilisateur supprimés.');
      router.replace({ name: 'Login' });
  };
  
  // --- Profil Utilisateur ---
  const fetchUserProfile = async () => {
      isLoadingProfile.value = true; profileError.value = ''; const token = getAuthToken();
      if (!token) { profileError.value = 'Non connecté.'; isLoadingProfile.value = false; return; }
      try {
          const response = await fetch(`${apiBaseUrl}/auth/me`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }, });
          const responseBodyText = await response.text();
          if (!response.ok) {
              let errorMsg = `Erreur ${response.status}`;
              if (response.status === 401) { errorMsg = "Session expirée/invalide."; }
              else { try { const errData = JSON.parse(responseBodyText); errorMsg = errData.message || `Erreur serveur (${response.status})`; } catch (e) { errorMsg = `Erreur serveur (${response.status}) - Réponse inattendue.`; } }
              throw new Error(errorMsg);
          }
          const result = JSON.parse(responseBodyText);
          if (result.status === 'success' && result.data?.user) {
              const user = result.data.user;
              userName.value = user.username || ''; userEmail.value = user.email || ''; userAvatarPath.value = user.avatar || '';
          } else { throw new Error('Réponse API profil invalide.'); }
      } catch (error) {
          console.error('Erreur profil (Sidebar):', error);
          if (!profileError.value) { profileError.value = error.message || 'Impossible de charger le profil.'; }
      } finally { isLoadingProfile.value = false; }
  };
  
  // --- Hook Cycle de Vie ---
  onMounted(() => { fetchUserProfile(); });
  
  // --- Show Recorder ---
  const requestShowRecorderAndClose = () => { requestShowRecorder(); closeSidebar(); };
  const requestShowRecorder = () => { emit('show-recorder'); };
  
  
  // --- Fonctions pour les Notifications ---
  
  const toggleNotificationsPopover = async () => {
      if (!isNotificationsPopoverVisible.value) {
          isNotificationsPopoverVisible.value = true;
          await fetchNotifications(); // Recharge à chaque ouverture
      } else {
          isNotificationsPopoverVisible.value = false;
      }
  };
  
  // Récupère TOUTES les notifications récentes (lues/non lues)
  const fetchNotifications = async () => {
      if (isLoadingNotifications.value) return;
      isLoadingNotifications.value = true; notificationsError.value = '';
      const token = getAuthToken();
      if (!token) { notificationsError.value = "Non connecté."; isLoadingNotifications.value = false; return; }
  
      // Appelle l'endpoint SANS ?status=unread pour tout récupérer
      const url = `${apiBaseUrl}/notifications`;
      console.log(`[Notifications] Fetching ALL recent from ${url}`);
      try {
          const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
          if (!response.ok) { throw new Error(`Erreur ${response.status}`); }
          const result = await response.json();
          if (result.status === 'success' && Array.isArray(result.data?.notifications)) {
              // Remplace la liste avec les données fraîches (lues et non lues)
              notifications.value = result.data.notifications;
              console.log(`[Notifications] Loaded ${notifications.value.length} total recent notifications.`);
          } else { throw new Error("Format de réponse API invalide."); }
      } catch (error) {
          console.error('[Notifications] Error fetching:', error);
          notificationsError.value = error.message || "Impossible de charger les notifications.";
      } finally { isLoadingNotifications.value = false; }
  };
  
  // Marque TOUTES comme lues (côté serveur et met à jour l'état local)
  const markAllNotificationsAsRead = async () => {
      const token = getAuthToken();
      if (!token) { alert("Veuillez vous reconnecter."); return; }
  
      const unreadNotificationsExist = notifications.value.some(n => !n.read);
      if (!unreadNotificationsExist) {
           console.log("[Notifications] No unread notifications to mark.");
           return; // Rien à faire
      }
  
      console.log("[Notifications] Marking all as read...");
      const url = `${apiBaseUrl}/notifications/mark-all-read`;
      try {
          const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
          if (!response.ok) { throw new Error(`Erreur ${response.status}`); }
  
          // --- Mise à jour locale après succès API ---
          notifications.value.forEach(notification => {
              notification.read = true; // Marque toutes comme lues dans le tableau local
          });
          console.log("[Notifications] Marked all as read locally and successfully on backend.");
          // On ne ferme PAS le popover
  
      } catch (error) {
          console.error('[Notifications] Error marking all as read:', error);
          notificationsError.value = error.message || "Erreur lors de la mise à jour.";
          // Ne pas modifier l'état local si l'API échoue
      }
  };
  
  // Marque UNE notification comme lue (au clic)
  const markOneAsRead = async (notification) => {
      if (notification.read || isLoadingNotifications.value) return;
  
      console.log(`[Notifications] Marking notification ${notification.id} as read...`);
      const token = getAuthToken();
      if (!token) return;
  
      const originalReadStatus = notification.read; // false
      notification.read = true; // Mise à jour optimiste
  
      const url = `${apiBaseUrl}/notifications/${notification.id}/read`;
      try {
          const response = await fetch(url, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (!response.ok) {
              notification.read = originalReadStatus; // Annuler si échec
              throw new Error(`Erreur ${response.status}`);
          }
          console.log(`[Notifications] Successfully marked ${notification.id} as read on backend.`);
      } catch (error) {
          notification.read = originalReadStatus; // Annuler si échec
          console.error(`[Notifications] Error marking ${notification.id} as read:`, error);
          notificationsError.value = `Erreur MàJ notif`; // Erreur discrète
      }
  };
  
  
  // Helper pour formater le temps (exemple)
  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString); const now = new Date();
      const diff = Math.floor((now - date) / 1000);
      if (diff < 60) return `${diff}s`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
      return `${Math.floor(diff / 86400)}j`;
    } catch (e) { return '?'; }
  };
  
  // Helper pour avatar acteur (exemple)
  const getActorAvatarUrl = (avatarPath) => {
    const placeholder = 'https://via.placeholder.com/30?text=?';
    if (!avatarPath) return placeholder;
    if (avatarPath.startsWith('http')) return avatarPath;
    if (!apiUrlBase) return placeholder;
    try { return new URL(avatarPath, apiUrlBase).href; } catch (e) { return placeholder; }
  };
  
</script>
  
  
<style scoped>
  /* --- STYLES RESPONSIVE SIDEBAR (Existants) --- */
  .sidebar {
      position: fixed; top: 0; left: 0; width: 280px; height: 100%;
      background-color: #ffffff; padding: 20px; display: flex; flex-direction: column;
      box-sizing: border-box; border-right: 1px solid #e0e0e0;
      transform: translateX(-100%); transition: transform 0.3s ease-in-out;
      z-index: 1000; overflow-y: auto;
       /* Style scrollbar pour la sidebar elle-même (optionnel) */
      scrollbar-width: thin;
      scrollbar-color: #adb5bd #f8f9fa;
  }
   .sidebar::-webkit-scrollbar { width: 5px; }
   .sidebar::-webkit-scrollbar-track { background: #f8f9fa; }
   .sidebar::-webkit-scrollbar-thumb { background-color: #adb5bd; border-radius: 3px;}
   .sidebar::-webkit-scrollbar-thumb:hover { background-color: #6c757d; }

  .sidebar.is-open { transform: translateX(0); box-shadow: 4px 0px 15px rgba(0, 0, 0, 0.1); }
  .sidebar-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.4); opacity: 0; visibility: hidden;
      transition: opacity 0.3s ease-in-out, visibility 0s 0.3s linear; z-index: 999;
  }
  .sidebar-overlay.is-open { opacity: 1; visibility: visible; transition: opacity 0.3s ease-in-out, visibility 0s 0s linear; }
  .close-sidebar-button {
      position: absolute; top: 10px; right: 15px; background: none; border: none;
      font-size: 2em; color: #6c757d; cursor: pointer; padding: 5px; line-height: 1; z-index: 1001;
  }
  @media (min-width: 992px) {
      .close-sidebar-button { display: none; }
      .sidebar { position: sticky; height: 100vh; transform: translateX(0); z-index: 1; width: 350px; box-shadow: none; }
      .sidebar-overlay { display: none; }
  }

  /* --- Styles du contenu (Existants) --- */
  .user-profile-link { display: block; text-decoration: none; color: inherit; outline: none; margin-bottom: 25px; border-radius: 8px; transition: background-color 0.2s; }
  .user-profile-link:hover .user-profile:not(.loading):not(.error) { background-color: #f0f0f0; cursor: pointer; }
  .user-profile { display: flex; align-items: center; padding: 10px; border-radius: 8px; min-height: 60px; }
  .user-profile.loading { color: #6c757d; justify-content: center; font-style: italic; background-color: #f8f9fa; }
  .user-profile.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; font-size: 0.9em; flex-direction: column; align-items: flex-start; gap: 5px; padding: 15px; }
  .retry-button { background-color: #721c24; color: white; border: none; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; cursor: pointer; margin-top: 5px; }
  .user-profile .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover; background-color: #e0e0e0; flex-shrink: 0; }
  .user-profile .user-info { display: flex; flex-direction: column; overflow: hidden; }
  .user-profile .name { font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-profile .email { font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .publish-button { background-color: #f5a623; color: white; border: none; padding: 12px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; text-align: center; margin-bottom: 25px; font-size: 14px; transition: background-color 0.2s; }
  .publish-button:hover { background-color: #e0901d; }
  .main-nav, .secondary-nav { display: flex; flex-direction: column; gap: 5px; }
  .nav-item { display: flex; align-items: center; padding: 10px 15px; border-radius: 8px; text-decoration: none; color: #333; font-size: 14px; transition: background-color 0.2s, color 0.2s; white-space: nowrap; }
  .nav-item .icon { margin-right: 12px; font-size: 18px; width: 20px; text-align: center; flex-shrink: 0; }
  .nav-item:hover { background-color: #f0f0f0; }
  .nav-item.active { background-color: #eef2ff; color: #4f46e5; font-weight: bold; }
  .separator { height: 1px; background-color: #e0e0e0; margin: 25px 0; }
  .secondary-nav { padding-bottom: 20px; }
  /* Style spécifique pour le bouton Notification (si besoin de différencier) */
  .secondary-nav .nav-item { color: #555; } /* S'applique aussi au bouton notification */
  .secondary-nav .nav-item:hover { background-color: #f0f0f0; }
  .secondary-nav .badge { margin-left: auto; background-color: red; color: white; border-radius: 10px; min-width: 20px; height: 20px; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold; padding: 0 5px; }
  .logout-button { width: 100%; margin-top: 5px; color: #dc3545; background: none; border: none; text-align: left; cursor: pointer; }
  .logout-button:hover { background-color: #f8d7da; }

  /* --- Styles pour le Popover Notifications --- */
  .notification-trigger {
      position: relative;
      /* Le reste des styles vient de .nav-item */
  }

  .notifications-popover {
      position: absolute;
      bottom: 80px; /* Ajustez pour positionner correctement au-dessus */
      left: 10px;
      right: 10px;
      width: auto; /* S'adapte au contenu jusqu'à max-width */
      max-width: 380px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1010;
      color: #333;
      display: flex;
      flex-direction: column;
      max-height: 400px;
      overflow: hidden; /* Cache le contenu qui dépasse (géré par popover-body) */
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  }

  .notifications-popover .popover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0; /* Ne rétrécit pas */
  }
  .notifications-popover .popover-header h3 { margin: 0; font-size: 1em; font-weight: 600; }
  .notifications-popover .mark-read-button { background: none; border: none; color: #007bff; font-size: 0.8em; cursor: pointer; padding: 3px 5px; transition: color 0.2s ease;}
  .mark-read-button:hover { text-decoration: underline; }
  .mark-read-button:disabled { color: #6c757d; cursor: not-allowed; text-decoration: none; }

  .notifications-popover .popover-body {
      overflow-y: auto; /* Active le scroll vertical si besoin */
      flex-grow: 1; /* Prend l'espace restant */
      padding: 0; /* Le padding sera sur les items */
      /* Style scrollbar */
      scrollbar-width: thin;
      scrollbar-color: #adb5bd #f0f0f0; /* Pouce et piste */
  }
  .popover-body::-webkit-scrollbar { width: 5px; }
  .popover-body::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 3px; }
  .popover-body::-webkit-scrollbar-thumb { background-color: #adb5bd; border-radius: 3px; }
  .popover-body::-webkit-scrollbar-thumb:hover { background-color: #6c757d; }

  /* Messages dans le popover */
  .notifications-popover .loading-message,
  .notifications-popover .error-message,
  .notifications-popover .empty-message { padding: 20px 15px; text-align: center; font-size: 0.9em; color: #6c757d; }
  .notifications-popover .error-message { color: #dc3545; }
  .popover-error .retry-button.small { font-size: 0.9em; padding: 2px 6px; margin-left: 10px; background-color: #dc3545; border: none; color: white; border-radius: 3px; }

  /* Liste et items de notification */
  .notifications-list { list-style: none; padding: 0; margin: 0; }

  /* MODIFICATION: Style de base + bordure */
  .notification-item {
      display: flex;
      align-items: center;
      padding: 12px 15px 12px 10px; /* Réduit padding gauche */
      border-bottom: 1px solid #f0f0f0;
      gap: 10px;
      font-size: 0.9em;
      position: relative; /* Pour positionner la bordure pseudo-élément */
      cursor: pointer; /* Indique cliquable */
      transition: background-color 0.2s ease, border-left-color 0.3s ease-out; /* Transition pour hover et état lu */
      border-left: 4px solid #007bff; /* Bordure bleue par défaut (NON LU) */
  }
  .notification-item:last-child { border-bottom: none; }
  .notification-item:hover { background-color: #f8f9fa; }

  /* NOUVEAU: Style pour l'état lu */
  .notification-item.is-read {
      border-left-color: #e0e0e0; /* Bordure grise (ou transparent) pour LU */
      /* Optionnel: griser le texte ou l'icône si lu */
      /* color: #6c757d; */
  }
  
   /* S'assurer que les couleurs spécifiques (like) priment sur le gris */
   .notification-item.is-read .notification-icon .liked { color: #f1a4a0; /* Rouge désaturé si lu */ }
   .notification-item.is-read .notification-icon .fa-comment { color: #7fbcff; /* Bleu désaturé si lu */ }
   .notification-item.is-read .notification-icon .fa-share-nodes { color: #89d5e3; /* Cyan désaturé si lu */ }


  .notification-icon { font-size: 1.1em; width: 25px; text-align: center; flex-shrink: 0; color: #6c757d; transition: color 0.2s ease;}
  .notification-icon .liked { color: #e53e3e; }
  .notification-icon .fa-comment { color: #007bff; }
  .notification-icon .fa-share-nodes { color: #17a2b8; }
  .notification-content { flex-grow: 1; line-height: 1.4; }
  .notification-text { margin: 0 0 3px 0; color: #333; }
  .actor-name { font-weight: 600; }
  .notification-timestamp { font-size: 0.8em; color: #6c757d; display: block; }
  .actor-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background-color: #e9ecef; } /* Ajout fond placeholder */
  .actor-avatar.placeholder { background-color: #e0e0e0; color: #6c757d; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9em; }

  /* Optionnel: pour empêcher le scroll du body quand sidebar ouverte */
  /* body.sidebar-open-no-scroll { overflow: hidden; }
  @media (min-width: 992px) { body.sidebar-open-no-scroll { overflow: auto; } } */

</style>