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
            <router-link to="/userdash" class="nav-item" active-class="active" @click="closeSidebar">
                 <span class="icon"><i class="fa-solid fa-table-columns"></i></span>
                 Tableau de Bord
            </router-link>
            <!--<router-link to="/chat" class="nav-item" active-class="active" @click="closeSidebar">
                 <span class="icon"><i class="fa-solid fa-comment-dots"></i></span>
                 Conversation
            </router-link> -->
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

  // --- URLs de l'API (Standardisé) ---
  // Utilise la variable d'environnement VITE_API_BASE_URL si définie, sinon http://localhost:5000
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app';
  // URL pour les API (si votre /api est préfixé dans server.js, sinon ajoutez /api ici)
  const API_ENDPOINT_BASE = `${API_BASE_URL}`; // Ou `${API_BASE_URL}/api` si nécessaire

  // --- État Sidebar ---
  const isSidebarOpen = ref(false);

  // --- Infos Utilisateur ---
  const userName = ref('');
  const userEmail = ref('');
  const userAvatarPath = ref(''); // Stocke le chemin relatif ou l'URL complète de l'API
  const isLoadingProfile = ref(true);
  const profileError = ref('');

  // --- État pour les Notifications ---
  const isNotificationsPopoverVisible = ref(false);
  const notifications = ref([]);
  const isLoadingNotifications = ref(false);
  const notificationsError = ref('');

  // --- FONCTIONS HELPER ---

  /** Récupère le token d'authentification depuis le localStorage. */
  const getAuthToken = () => localStorage.getItem('authToken');

  /**
   * Construit l'URL complète d'un avatar.
   * @param {string | null | undefined} avatarPath - Chemin relatif ou URL complète.
   * @returns {string} URL complète ou placeholder.
   */
  const formatFullAvatarUrl = (avatarPath) => {
    const placeholder = 'https://via.placeholder.com/40?text=?'; // Placeholder générique
    if (!avatarPath) { return placeholder; }
    // Si c'est déjà une URL complète
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) { return avatarPath; }
    // Si l'URL de base n'est pas définie
    if (!API_BASE_URL) { console.warn("[Avatar URL] API_BASE_URL n'est pas défini."); return placeholder; }
    // Construire l'URL complète
    try {
      // Assurer qu'il n'y a pas de double slash si avatarPath commence par /
      const pathPrefix = avatarPath.startsWith('/') ? '' : '/';
      return `${API_BASE_URL}${pathPrefix}${avatarPath}`;
    } catch (e) {
      console.error(`[Avatar URL] Erreur construction URL pour ${avatarPath}:`, e);
      return placeholder;
    }
  };

  // --- Propriété Calculée Avatar Utilisateur ---
  // Utilise la fonction helper pour construire l'URL
  const userAvatarUrl = computed(() => {
    return formatFullAvatarUrl(userAvatarPath.value);
  });

  // --- Compteur pour le Badge Notifications ---
  const unreadNotificationCount = computed(() => {
      return notifications.value.filter(n => !n.read).length;
  });


  // --- Fonctions Sidebar ---
  const openSidebar = () => {
      isSidebarOpen.value = true;
      document.body.classList.add('sidebar-open-no-scroll');
  };
  const closeSidebar = () => {
      isSidebarOpen.value = false;
      isNotificationsPopoverVisible.value = false; // Ferme aussi le popover
      document.body.classList.remove('sidebar-open-no-scroll');
  };
  const toggleSidebar = () => {
      if (isSidebarOpen.value) { closeSidebar(); } else { openSidebar(); }
  };

  // --- Expose (pour contrôle parent éventuel) ---
  defineExpose({ openSidebar, closeSidebar, toggleSidebar });

  // --- Déconnexion ---
  const handleLogoutAndClose = () => { handleLogout(); closeSidebar(); };
  const handleLogout = () => {
      console.log('[Sidebar] Déconnexion initiée...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId'); // Si vous stockez aussi l'ID
      // Réinitialiser l'état local
      userName.value = '';
      userEmail.value = '';
      userAvatarPath.value = '';
      profileError.value = '';
      notifications.value = [];
      console.log('[Sidebar] Token et infos utilisateur supprimés.');
      // Rediriger vers la page de connexion (utiliser replace pour ne pas avoir d'historique)
      router.replace({ name: 'Login' });
  };

  // --- Profil Utilisateur ---
  const fetchUserProfile = async () => {
      isLoadingProfile.value = true;
      profileError.value = '';
      const token = getAuthToken();
      if (!token) {
          profileError.value = 'Non connecté.';
          isLoadingProfile.value = false;
          return;
      }

      // Construire l'URL de l'API /me
      const url = `${API_ENDPOINT_BASE}/auth/me`; // Assurez-vous que le préfixe /api est correct
      console.log(`[Sidebar] Fetching user profile from ${url}`);

      try {
          const response = await fetch(url, {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
              },
          });

          const responseBodyText = await response.text(); // Lire le corps pour le parsing manuel

          if (!response.ok) {
              let errorMsg = `Erreur ${response.status}`;
              if (response.status === 401) {
                  errorMsg = "Session expirée ou invalide.";
                  // Peut-être déclencher la déconnexion ici ?
                  // handleLogout();
              } else {
                  try {
                      const errData = JSON.parse(responseBodyText);
                      errorMsg = errData.message || `Erreur serveur (${response.status})`;
                  } catch (e) {
                      errorMsg = `Erreur serveur (${response.status}) - Réponse inattendue: ${responseBodyText.substring(0, 100)}`;
                  }
              }
              throw new Error(errorMsg);
          }

          // Essayer de parser le JSON
          const result = JSON.parse(responseBodyText);

          // Vérifier la structure attendue de la réponse
          if (result.status === 'success' && result.data?.user) {
              const user = result.data.user;
              userName.value = user.username || '';
              userEmail.value = user.email || '';
              userAvatarPath.value = user.avatar || ''; // Stocke le chemin tel quel
              console.log("[Sidebar] User profile loaded:", { username: user.username, avatarPath: user.avatar });
          } else {
              throw new Error(`Réponse API profil invalide: ${JSON.stringify(result)}`);
          }
      } catch (error) {
          console.error('[Sidebar] Erreur fetchUserProfile:', error);
          // Afficher l'erreur uniquement si elle n'a pas déjà été définie (ex: par 401)
          if (!profileError.value) {
              profileError.value = error.message || 'Impossible de charger le profil.';
          }
      } finally {
          isLoadingProfile.value = false;
      }
  };

  // --- Hook Cycle de Vie ---
  onMounted(() => {
      fetchUserProfile(); // Charger le profil au montage
      // Optionnel: Charger les notifications initiales si nécessaire au démarrage
      // fetchNotifications();
  });

  // --- Émission pour Afficher l'Enregistreur Vocal ---
  const requestShowRecorderAndClose = () => { requestShowRecorder(); closeSidebar(); };
  const requestShowRecorder = () => { emit('show-recorder'); };


  // --- Fonctions pour les Notifications ---

  /** Affiche/cache le popover des notifications et charge les données si ouvert. */
  const toggleNotificationsPopover = async () => {
      if (!isNotificationsPopoverVisible.value) {
          isNotificationsPopoverVisible.value = true;
          await fetchNotifications(); // Recharge les notifications à chaque ouverture
      } else {
          isNotificationsPopoverVisible.value = false;
      }
      // Empêcher la fermeture de la sidebar si on clique sur le bouton notif
      // event.stopPropagation(); // Peut être géré différemment selon la structure HTML
  };

  /** Récupère les notifications récentes depuis l'API. */
  const fetchNotifications = async () => {
      if (isLoadingNotifications.value) return; // Empêche les appels multiples
      isLoadingNotifications.value = true;
      notificationsError.value = '';
      const token = getAuthToken();
      if (!token) { notificationsError.value = "Non connecté."; isLoadingNotifications.value = false; return; }

      // URL pour récupérer les notifications (supposons que l'API renvoie les plus récentes, lues ou non)
      const url = `${API_ENDPOINT_BASE}/notifications`; // Ajustez l'URL si nécessaire
      console.log(`[Notifications] Fetching from ${url}`);
      try {
          const response = await fetch(url, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (!response.ok) { throw new Error(`Erreur ${response.status} lors de la récupération des notifications.`); }
          const result = await response.json();
          // Vérifier la structure de la réponse
          if (result.status === 'success' && Array.isArray(result.data?.notifications)) {
              notifications.value = result.data.notifications;
              console.log(`[Notifications] Loaded ${notifications.value.length} notifications.`);
          } else {
              throw new Error("Format de réponse API invalide pour les notifications.");
          }
      } catch (error) {
          console.error('[Notifications] Error fetching:', error);
          notificationsError.value = error.message || "Impossible de charger les notifications.";
          notifications.value = []; // Vider en cas d'erreur
      } finally {
          isLoadingNotifications.value = false;
      }
  };

  /** Marque toutes les notifications non lues comme lues via l'API. */
  const markAllNotificationsAsRead = async () => {
      const token = getAuthToken();
      if (!token) { alert("Veuillez vous reconnecter."); return; }

      // Vérifier s'il y a des notifications non lues à marquer
      const unreadNotificationsExist = notifications.value.some(n => !n.read);
      if (!unreadNotificationsExist) {
           console.log("[Notifications] Aucune notification non lue à marquer.");
           return;
      }

      console.log("[Notifications] Marquage de toutes les notifications comme lues...");
      // URL pour marquer toutes comme lues
      const url = `${API_ENDPOINT_BASE}/notifications/mark-all-read`;
      try {
          const response = await fetch(url, {
              method: 'POST', // Ou PATCH selon votre API
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (!response.ok) { throw new Error(`Erreur ${response.status} lors du marquage.`); }

          // Si succès API, mettre à jour l'état local
          notifications.value.forEach(notification => {
              notification.read = true; // Marquer comme lu localement
          });
          console.log("[Notifications] Toutes les notifications marquées comme lues (localement et backend).");

      } catch (error) {
          console.error('[Notifications] Erreur markAllNotificationsAsRead:', error);
          notificationsError.value = error.message || "Erreur lors de la mise à jour.";
          // Ne pas modifier l'état local si l'API échoue
      }
  };

  /**
   * Marque une notification spécifique comme lue (au clic).
   * Fait une mise à jour optimiste de l'UI.
   * @param {object} notification - La notification à marquer.
   */
  const markOneAsRead = async (notification) => {
      // Ne rien faire si déjà lue ou en cours de chargement général
      if (notification.read || isLoadingNotifications.value) return;

      console.log(`[Notifications] Marquage de la notification ${notification.id} comme lue...`);
      const token = getAuthToken();
      if (!token) return;

      const originalReadStatus = notification.read; // Sauvegarder l'état initial (qui est false ici)
      notification.read = true; // <-- MISE À JOUR OPTIMISTE : Marquer comme lu dans l'UI immédiatement

      // URL pour marquer une notification spécifique comme lue
      const url = `${API_ENDPOINT_BASE}/notifications/${notification.id}/read`;
      try {
          const response = await fetch(url, {
              method: 'PATCH', // Ou POST selon votre API
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (!response.ok) {
              notification.read = originalReadStatus; // <-- ROLLBACK : Annuler la mise à jour UI si l'API échoue
              throw new Error(`Erreur ${response.status} lors du marquage de la notification ${notification.id}.`);
          }
          console.log(`[Notifications] Notification ${notification.id} marquée comme lue avec succès (backend).`);
          // La mise à jour UI est déjà faite (optimiste)
      } catch (error) {
          notification.read = originalReadStatus; // <-- ROLLBACK : Annuler aussi en cas d'erreur catch
          console.error(`[Notifications] Erreur markOneAsRead (${notification.id}):`, error);
          notificationsError.value = `Erreur MàJ notif`; // Afficher une erreur discrète
      }
  };


  /** Formate une date ISO en temps relatif (ex: 5m, 2h, 3j). */
  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSeconds < 60) return `à l'instant`; // Moins d'une minute
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`; // Minutes
      if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`; // Heures
      // Si plus d'un jour, on peut afficher la date courte
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      // Ou continuer avec les jours: return `${Math.floor(diffSeconds / 86400)}j`;

    } catch (e) {
      console.error("Erreur formatRelativeTime:", isoString, e);
      return '?';
    }
  };

  /** Construit l'URL de l'avatar pour l'acteur d'une notification. */
  const getActorAvatarUrl = (avatarPath) => {
    // Réutilise la même logique que pour l'avatar principal
    return formatFullAvatarUrl(avatarPath);
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