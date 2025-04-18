<template>
  <!-- État de chargement initial ou erreur -->
  <div v-if="loadingUser" class="loading-overlay">
    <p>Chargement de vos informations...</p>
  </div>
  <div v-else-if="initError" class="error-overlay">
    <p>Erreur d'initialisation : {{ initError }}</p>
    <button @click="retryInitialization">Réessayer</button>
  </div>

  <!-- Conteneur principal -->
  <div v-else class="chat-view" :class="theme">

    <!-- Sidebar (Liste des Conversations) -->
    <div class="sidebar" :class="{ 'visible': !isMobileView || mobileVisibleSection === 'sidebar' }">
      <div class="sidebar-header">
        <div class="user-info-header">
           <img :src="formatAvatarUrl(currentUser?.avatar)" alt="Mon Avatar" class="avatar-small"/>
           <span>{{ currentUser?.username || 'Utilisateur' }}</span>
        </div>
        <router-link to="/dashboard" class="nav-item">
          <i class="fa-sharp fa-solid fa-house"></i>
        </router-link>
        <button @click="toggleTheme" class="theme-toggle">
          <span v-if="theme === 'light'">🌙</span>
          <span v-else>☀️</span>
        </button>
        
      </div>
      <div class="conversations-list">
        <div v-if="loadingConversations" class="loading-placeholder">Chargement...</div>
        <div v-else-if="conversations.length === 0" class="empty-placeholder">
          Aucune conversation.
        </div>
        <ul v-else>
          <!-- Le clic sur une conversation gère maintenant aussi le changement de vue sur mobile via la méthode selectConversation -->
          <li
            v-for="conv in filteredConversations"
            :key="conv.id"
            @click="selectConversation(conv)"
            :class="{ active: selectedConversation?.id === conv.id }"
            class="conversation-item"
          >
            <img :src="getConversationAvatar(conv)" alt="Avatar" class="avatar" />
            <div class="conversation-info">
              <span class="name">{{ getConversationName(conv) }}</span>
              <span class="last-message" v-if="conv.lastMessage">
                 {{ truncate(conv.lastMessage.content, 30) }}
              </span>
               <span class="last-message" v-else-if="!conv.lastMessage">
                 Pas encore de messages
               </span>
            </div>
            <div class="conversation-meta" v-if="conv.lastMessage">
               <span class="timestamp">{{ formatTimestamp(conv.lastMessage.createdAt) }}</span>
               <!-- Optionnel: Badge non lu (si tu as cette logique) -->
               <!-- <span v-if="conv.unreadCount > 0" class="unread-badge">{{ conv.unreadCount }}</span> -->
            </div>
          </li>
        </ul>
      </div>
       <button @click="startNewConversation" class="new-conversation-btn">
            Nouvelle Conversation (+)
        </button>
    </div>

    <!-- Zone Principale (Chat Actif) -->
    <!-- AJOUT: Classe conditionnelle pour la visibilité sur mobile -->
    <div class="chat-area" :class="{ 'visible': !isMobileView || mobileVisibleSection === 'chat' }">
      <!-- Affichage si une conversation est sélectionnée -->
      <div v-if="selectedConversation" class="chat-content">
        <div class="chat-header">
          <!-- AJOUT: Bouton Retour (visible seulement sur mobile via CSS) -->
          <button @click="showConversationList" class="back-to-conversations-btn">
             < <!-- Icône "inférieur à" comme flèche retour -->
          </button>
          <!-- Reste du header -->
          <img :src="getConversationAvatar(selectedConversation)" alt="Avatar" class="avatar" />
          <h3>{{ getConversationName(selectedConversation) }}</h3>
          <!-- Optionnel: Ajouter des icônes/boutons ici (infos groupe, appel video...) -->
        </div>

        <!-- Conteneur des messages -->
        <div class="messages-container" ref="messagesContainerRef">
           <div v-if="loadingMessages" class="loading-placeholder">Chargement des messages...</div>
           <div v-else-if="messages.length === 0" class="empty-placeholder messages-empty">
             C'est le début de votre conversation ! Envoyez un message.
           </div>
          <div v-else>
            <!-- TODO: Bouton "Charger plus anciens" si pagination API implémentée -->
            <div
              v-for="message in messages"
              :key="message.id"
              class="message"
              :class="{ 'my-message': message.sender_id === currentUser?.id, 'other-message': message.sender_id !== currentUser?.id }"
            >
              <div class="message-bubble">
                 <!-- Afficher l'avatar de l'autre uniquement pour ses messages -->
                 <img
                    v-if="message.sender_id !== currentUser?.id"
                    :src="formatAvatarUrl(message.sender?.avatar)"
                    alt="Sender Avatar"
                    class="message-avatar"
                 />
                <div class="message-content">
                  <!-- Afficher nom expéditeur si groupe ET message d'un autre -->
                  <span v-if="selectedConversation.is_group && message.sender_id !== currentUser?.id" class="sender-name">
                      {{ message.sender?.username || 'Utilisateur inconnu' }}
                  </span>
                  <p>{{ message.content }}</p>
                  <span class="timestamp">{{ formatTimestamp(message.createdAt, true) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Zone de saisie -->
        <div class="message-input-area">
          <textarea
            v-model="newMessage"
            @keyup.enter.prevent="handleSendMessage"
            placeholder="Écrire un message..."
            rows="1"
            ref="messageInputRef"
            @input="adjustTextareaHeight"
            :disabled="!selectedConversation || loadingMessages"
          ></textarea>
          <button @click="handleSendMessage" :disabled="!newMessage.trim() || !selectedConversation || loadingMessages">
            Envoyer <!-- Optionnel: Remplacer par une icône -->
          </button>
        </div>
      </div>

      <!-- Affichage si aucune conversation n'est sélectionnée -->
      <div v-else class="no-conversation-selected">
         <!-- AJOUT: Bouton pour ouvrir la liste sur mobile depuis ce placeholder -->
         <!-- Ce bouton est masqué sur desktop par le CSS -->
         <button v-if="isMobileView" @click="showSidebar" class="sidebar-toggle-btn" style="position: static; margin-bottom: 15px; font-size: 1.2em; padding: 8px 15px; background-color: var(--accent-color); color: var(--accent-text-color); border-radius: 5px;">
              Voir les conversations
          </button>
          <!-- Contenu existant -->
           <div style="width: 100;">
            <i class="fa-solid fa-comments"></i>
           </div>
        <p>Sélectionnez ou créez une conversation pour commencer à discuter.</p>
      </div>
    </div>

    <!-- Modale Nouvelle Conversation -->
     <div v-if="showNewConversationModal" class="modal-overlay" @click.self="closeNewConversationModal">
         <div class="modal-content">
            <h3>Démarrer une nouvelle conversation</h3>
            <input type="search" v-model="userSearchQuery" @input="searchUsers" placeholder="Rechercher par nom ou pseudo..." />
            <div class="user-search-results-container">
                <ul v-if="!searchingUsers && searchResults.length > 0" class="user-search-results">
                    <!-- Le clic ici appelle createOrGoToConversation qui gère aussi le switch de vue mobile -->
                    <li v-for="user in searchResults" :key="user.id" @click="createOrGoToConversation(user)">
                        <img :src="formatAvatarUrl(user.avatar)" alt="Avatar" class="avatar-small"/>
                        <span>{{ user.username }}</span>
                        <span v-if="user.fullName"> ({{ user.fullName }})</span>
                    </li>
                </ul>
                <div v-else-if="searchingUsers" class="loading-placeholder small">Recherche...</div>
                <div v-else-if="userSearchQuery && !searchingUsers && searchResults.length === 0" class="empty-placeholder small">Aucun utilisateur trouvé.</div>
                 <div v-else class="empty-placeholder small">Entrez un nom ou pseudo pour rechercher.</div>
            </div>
             <button @click="closeNewConversationModal" class="close-modal-btn">Fermer</button>
         </div>
     </div>

  </div>
</template>       
  
<script setup>
  import { useRouter } from 'vue-router';

  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import { initSocket, getSocket, joinConversationRoom, leaveConversationRoom, sendMessage as sendSocketMessage, disconnectSocket } from '@/services/socket'; // Ajustez le chemin
  const router = useRouter();

  // --- État Réactif ---
  const conversations = ref([]);
  const selectedConversation = ref(null);
  const messages = ref([]);
  const newMessage = ref('');
  const currentUser = ref(null);
  const theme = ref('light');
  const messagesContainerRef = ref(null);
  const messageInputRef = ref(null);
  const loadingConversations = ref(false);
  const loadingMessages = ref(false);
  const showNewConversationModal = ref(false);
  const userSearchQuery = ref('');
  const searchResults = ref([]);
  const searchingUsers = ref(false);
  let searchTimeout = null;
  const socket = ref(null);
  const loadingUser = ref(true);
  const initError = ref(null);

  // --- NOUVEAU: État pour la responsivité ---
  const isMobileView = ref(window.innerWidth <= 768);
  const mobileVisibleSection = ref('sidebar'); // 'sidebar' ou 'chat'

  // --- Constantes & Configuration ---
  const API_BASE_URL = import.meta.env.VUE_APP_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app';
  const DEFAULT_AVATAR = '/img/default-avatar.png';
  const GROUP_AVATAR = '/img/group-avatar.png';
  const MOBILE_BREAKPOINT = 768; // Seuil pour la vue mobile

  // --- Helpers API & Auth (inchangés) ---
  const handleApiResponse = async (response) => {
      // ... (code inchangé)
        if (!response.ok) {
          let errorData;
          try {
              errorData = await response.json();
          } catch (e) {
              try {
                  errorData = await response.text();
              } catch (e2) {
                  errorData = response.statusText;
              }
          }
          const error = new Error(`HTTP error! Status: ${response.status}`);
          error.status = response.status;
          error.data = errorData;
          console.error("API Response Error Data:", errorData);
          throw error;
      }
      if (response.status === 204) {
          return null;
      }
      return response.json();
  };
  const getAuthHeaders = () => {
      // ... (code inchangé)
      const headers = {
          'Accept': 'application/json',
      };
      const token = localStorage.getItem('authToken');
      if (token) {
          headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
  };

  // --- Fonctions Utilitaires (inchangées) ---
  const formatAvatarUrl = (avatarPath) => {
      // ... (code inchangé)
       if (!avatarPath) return DEFAULT_AVATAR;
       if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
           return avatarPath;
       }
       const pathPrefix = avatarPath.startsWith('/') ? '' : '/';
       return `${API_BASE_URL}${pathPrefix}${avatarPath}`;
  };
  const formatTimestamp = (timestamp, full = false) => {
      // ... (code inchangé)
      if (!timestamp) return '';
      try {
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) throw new Error("Invalid date");
          const now = new Date();
          const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          const timeFormat = { hour: '2-digit', minute: '2-digit' };
          const dateFormat = { day: '2-digit', month: '2-digit', year: 'numeric' };

          if (full) {
              if (dateDay.getTime() === today.getTime()) return `Aujourd'hui ${date.toLocaleTimeString([], timeFormat)}`;
              if (dateDay.getTime() === yesterday.getTime()) return `Hier ${date.toLocaleTimeString([], timeFormat)}`;
              return `${date.toLocaleDateString([], dateFormat)} ${date.toLocaleTimeString([], timeFormat)}`;
          } else {
              if (dateDay.getTime() === today.getTime()) return date.toLocaleTimeString([], timeFormat);
              if (dateDay.getTime() === yesterday.getTime()) return 'Hier';
              return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
          }
      } catch (e) {
          console.error("[ChatView] Erreur formatage timestamp:", timestamp, e);
          return '';
      }
  };
   const truncate = (text, length) => {
      // ... (code inchangé)
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
  };
  const getOtherParticipant = (conv) => {
      // ... (code inchangé)
      if (!conv?.participants || conv.is_group || !currentUser.value) return null;
      return conv.participants.find(p => p.id !== currentUser.value?.id);
  };
  const getConversationName = (conv) => {
      // ... (code inchangé)
      if (!conv) return '';
      if (conv.is_group) return conv.name || 'Groupe sans nom';
      const other = getOtherParticipant(conv);
      return other?.fullName || other?.username || 'Utilisateur inconnu';
  };
  const getConversationAvatar = (conv) => {
      // ... (code inchangé)
       if (!conv) return DEFAULT_AVATAR;
       if (conv.is_group) return GROUP_AVATAR; // Ou formatAvatarUrl(conv.group_icon) si tu as ça
       const other = getOtherParticipant(conv);
       return formatAvatarUrl(other?.avatar);
  };
  const scrollToBottom = (behavior = 'smooth') => {
      // ... (code inchangé)
      nextTick(() => {
        if (messagesContainerRef.value) {
          messagesContainerRef.value.scrollTo({
              top: messagesContainerRef.value.scrollHeight,
              behavior: behavior
          });
        }
      });
  };
  const adjustTextareaHeight = () => {
      // ... (code inchangé)
      const textarea = messageInputRef.value;
      if (textarea) {
        textarea.style.height = 'auto';
        const maxHeight = 120;
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      }
  };
  const loadTheme = () => {
    // ... (code inchangé)
    const savedTheme = localStorage.getItem('chatTheme') || 'light';
    theme.value = savedTheme;
  };
  const toggleTheme = () => {
    // ... (code inchangé)
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('chatTheme', theme.value);
  };


  // --- Fonctions API (inchangées) ---
  const fetchCurrentUser = async () => {
    // ... (code inchangé)
    loadingUser.value = true;
    initError.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'GET',
          headers: getAuthHeaders(),
      });
      const data = await handleApiResponse(response);
      if (data.status === 'success' && data.data?.user) {
        currentUser.value = data.data.user;
        console.log('[ChatView] Utilisateur actuel chargé:', currentUser.value?.id);
      } else {
        throw new Error(`Format de réponse API invalide depuis /api/auth/me: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("[ChatView] Erreur lors de la récupération de l'utilisateur connecté:", error);
      if (error.status === 401) { initError.value = "Session expirée ou invalide. Veuillez vous reconnecter."; }
      else { initError.value = `Impossible de charger vos informations utilisateur. ${error.message || ''}`; }
      currentUser.value = null;
    } finally {
      loadingUser.value = false;
    }
  };
  const fetchConversations = async () => {
    // ... (code inchangé)
    if (!currentUser.value) return;
    loadingConversations.value = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
          method: 'GET',
          headers: getAuthHeaders(),
      });
      const data = await handleApiResponse(response);
      conversations.value = data?.data?.conversations || [];
      conversations.value.sort((a, b) => { /* ... tri ... */ return (new Date(b.lastMessage?.createdAt || b.updatedAt)).getTime() - (new Date(a.lastMessage?.createdAt || a.updatedAt)).getTime(); });
       console.log(`[ChatView] ${conversations.value.length} conversations chargées.`);
    } catch (error) {
      console.error("[ChatView] Erreur lors de la récupération des conversations:", error);
      conversations.value = [];
    } finally {
      loadingConversations.value = false;
    }
  };
  const fetchMessages = async (conversationId) => {
    // ... (code inchangé)
    if (!conversationId || !currentUser.value) return;
    loadingMessages.value = true;
    messages.value = [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
          method: 'GET',
          headers: getAuthHeaders(),
      });
      const data = await handleApiResponse(response);
      messages.value = data?.data?.messages || [];
      console.log(`[ChatView] ${messages.value.length} messages chargés pour ${conversationId}.`);
      await nextTick();
      scrollToBottom('auto');
    } catch (error) {
      console.error(`[ChatView] Erreur lors de la récupération des messages pour ${conversationId}:`, error);
      messages.value = [];
    } finally {
        loadingMessages.value = false;
    }
  };

  // --- Fonctions Socket (inchangées structurellement) ---
  const setupSocketListeners = () => {
    // ... (code inchangé)
    socket.value = getSocket();
    if (socket.value) {
      socket.value.off('newMessage', handleNewMessage);
      socket.value.off('connect');
      socket.value.off('disconnect');
      socket.value.off('connect_error');
      socket.value.on('newMessage', handleNewMessage);
      socket.value.on('connect', () => { /* ... */ });
      socket.value.on('disconnect', (reason) => console.warn(`[ChatView] Socket déconnecté: ${reason}`));
      socket.value.on('connect_error', (err) => { /* ... error handling ... */});
      console.log("[ChatView] Écouteurs Socket configurés.");
    } else {
       console.error("[ChatView] Impossible de configurer les écouteurs: Socket non initialisé.");
       initError.value = "La connexion temps réel n'a pu être établie.";
    }
  };
  
  const handleSendMessage = () => {
  console.log('[handleSendMessage] Fonction appelée!');

  console.log('newMessage:', newMessage.value);
  console.log('selectedConversation ID:', selectedConversation.value?.id);
  console.log('Socket connecté ?:', socket.value?.connected);
  console.log('currentUser chargé ?:', !!currentUser.value);
  console.log('loadingMessages:', loadingMessages.value);

  if (!newMessage.value.trim() || !selectedConversation.value?.id || !socket.value?.connected || !currentUser.value || loadingMessages.value) {
    console.warn('[handleSendMessage] Envoi annulé - Condition non remplie.');
    if (!socket.value?.connected) console.error("CAUSE: Socket non connecté !"); // Cause fréquente
    // ... autres logs pour identifier la cause exacte si besoin ...
    return; // La fonction s'arrête ici si une condition échoue
  }

  console.log(`[ChatView] Tentative d'envoi message à ${selectedConversation.value.id}`);
  const messageData = { conversationId: selectedConversation.value.id, content: newMessage.value.trim() };

  console.log('[handleSendMessage] Données à envoyer via socket:', messageData);
  try {
      sendSocketMessage(messageData);
      console.log('[handleSendMessage] Appel à sendSocketMessage effectué.');

      newMessage.value = '';
      adjustTextareaHeight();
      nextTick(() => { messageInputRef.value?.focus(); });
  } catch (error) {
      console.error("[handleSendMessage] Erreur lors de l'appel à sendSocketMessage ou màj UI:", error);
  }
};

   const handleNewMessage = (message) => {
    // ... (code inchangé - gère la réception et mise à jour état)
        console.log('[ChatView] RAW newMessage received:', JSON.stringify(message, null, 2));
        if (!currentUser.value || !message || !message.id || !message.conversation_id) { /* ... */ return; }
        console.log(`[ChatView] Nouveau message (${message.id}) reçu pour conv ${message.conversation_id}`);
        if (selectedConversation.value?.id === message.conversation_id) {
            if (!messages.value.some(m => m.id === message.id)) {
                messages.value.push(message);
                scrollToBottom('smooth');
                console.log(`[ChatView] Message ${message.id} ajouté à la conversation active.`);
            } else { console.warn(`[ChatView] Message ${message.id} déjà présent, ignoré.`); }
        } else { console.log(`[ChatView] Message reçu pour une conversation non active (${message.conversation_id}).`); }
        const convIndex = conversations.value.findIndex(c => c.id === message.conversation_id);
        if (convIndex > -1) {
            const updatedConv = { ...conversations.value[convIndex] };
            updatedConv.lastMessage = { /* ... */ };
            updatedConv.updatedAt = message.createdAt;
            conversations.value.splice(convIndex, 1);
            conversations.value.unshift(updatedConv);
            console.log(`[ChatView] Aperçu conversation ${message.conversation_id} mis à jour.`);
        } else {
             console.warn(`[ChatView] Nouveau message reçu pour une conversation non listée: ${message.conversation_id}. Recharge de la liste.`);
             fetchConversations();
        }
   };

  // --- Fonction de Sélection de Conversation (MODIFIÉE) ---
  const selectConversation = (conversation) => {
     if (!currentUser.value || loadingMessages.value || !conversation || !conversation.id) return;
     // Sur desktop, on ne resélectionne pas si déjà sélectionné
     if (selectedConversation.value?.id === conversation.id && !isMobileView.value) return;

     console.log(`[ChatView] Sélection de la conversation: ${conversation.id}`);

     // Quitter l'ancienne room socket si nécessaire
     if (selectedConversation.value && socket.value && selectedConversation.value.id !== conversation.id) {
          console.log(`[ChatView] Quitte la room ${selectedConversation.value.id}`);
          leaveConversationRoom(selectedConversation.value.id);
     }

     selectedConversation.value = conversation;
     fetchMessages(conversation.id); // Charger les messages

     // Rejoindre la nouvelle room socket si nécessaire
     if (socket.value && selectedConversation.value) {
          console.log(`[ChatView] Rejoignant la room ${conversation.id}`);
          joinConversationRoom(conversation.id);
     } else {
          console.warn("[ChatView] Socket non disponible pour rejoindre la room lors de la sélection.");
     }

     // *** AJOUT RESPONSIVE ***
     if (isMobileView.value) {
         mobileVisibleSection.value = 'chat'; // Basculer vers la vue chat sur mobile
         console.log("[ChatView] Vue Mobile: Bascule vers 'chat'");
     }
  };


  // --- Fonctions Modale Nouvelle Conversation (createOrGoToConversation MODIFIÉE) ---
  const startNewConversation = () => {
      // ... (code inchangé)
      showNewConversationModal.value = true;
      userSearchQuery.value = '';
      searchResults.value = [];
      searchingUsers.value = false;
  };
  const closeNewConversationModal = () => {
      // ... (code inchangé)
      showNewConversationModal.value = false;
  };
  const searchUsers = () => {
    clearTimeout(searchTimeout);
    if (!userSearchQuery.value.trim()) {
        searchResults.value = [];
        searchingUsers.value = false;
        return;
    }
    searchingUsers.value = true;
    searchTimeout = setTimeout(async () => {
        try {
            console.log(`[ChatView] Recherche utilisateurs: "${userSearchQuery.value}"`);
            // --- CORRECTION ICI: Utilisation des backticks (`) ---
            const response = await fetch(`${API_BASE_URL}/api/conversations/find-users?search=${encodeURIComponent(userSearchQuery.value)}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            // --- FIN CORRECTION ---

            const data = await handleApiResponse(response);
            searchResults.value = data?.data?.users || []; // Garde la sécurité avec ?. et || []
            console.log(`[ChatView] ${searchResults.value.length} utilisateurs trouvés.`);
        } catch (error) {
            console.error("[ChatView] Erreur lors de la recherche d'utilisateurs:", error);
            searchResults.value = [];
            // Afficher une erreur dans la modale ? (Commentaire conservé)
        } finally {
            searchingUsers.value = false;
        }
    }, 400); // Délai de debounce
};
  const createOrGoToConversation = async (user) => { // (MODIFIÉE LÉGÈREMENT)
       if (!currentUser.value || !user || !user.id) return;
       console.log(`[ChatView] Initialisation conversation avec: ${user.username} (ID: ${user.id})`);
       closeNewConversationModal(); // Fermer la modale immédiatement

       try {
            // Vérifier si la conversation existe déjà localement (inchangé)
            const existingConv = conversations.value.find(c =>
               !c.is_group && c.participants?.length === 2 &&
               c.participants.some(p => p.id === user.id) &&
               c.participants.some(p => p.id === currentUser.value?.id)
            );

            if (existingConv) {
                console.log(`[ChatView] Conversation existante trouvée localement (${existingConv.id}), sélection...`);
                selectConversation(existingConv); // Sélectionner l'existante
            } else {
                // Créer via API (inchangé)
                console.log(`[ChatView] Aucune conversation existante trouvée localement, création via API...`);
                const response = await fetch(`${API_BASE_URL}/api/conversations`, {
                    method: 'POST',
                    headers: { /* ... */ 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ participantIds: [user.id] })
                });
                const data = await handleApiResponse(response);
                const newConvData = data?.data?.conversation;

                if (newConvData && newConvData.id) {
                   console.log(`[ChatView] Nouvelle conversation créée via API (${newConvData.id}). Ajout à la liste et sélection.`);
                   conversations.value.unshift(newConvData); // Ajouter en haut
                   selectConversation(newConvData); // Sélectionner la nouvelle
                } else {
                    throw new Error("La réponse de l'API pour la création de conversation est invalide ou manquante.");
                }
            }
            // NOTE: La bascule mobile est gérée DANS selectConversation maintenant.

       } catch (error) {
           console.error("[ChatView] Erreur lors de la création/sélection de la conversation:", error);
           alert(`Impossible de démarrer la conversation. ${error.message || 'Erreur serveur.'}`);
           // Pas besoin de fermer la modale ici, déjà fait au début
       }
  };

  // --- NOUVEAU: Fonctions de Navigation Mobile ---
  /** Bascule vers la vue Sidebar sur mobile */
  const showConversationList = () => {
      if (isMobileView.value) {
          mobileVisibleSection.value = 'sidebar';
          console.log("[ChatView] Vue Mobile: Bascule vers 'sidebar'");
          // Optionnel : désélectionner la conv active ?
          // selectedConversation.value = null;
      }
  };
  /** Bascule vers la vue Sidebar sur mobile (utilisé par le bouton placeholder) */
  const showSidebar = () => {
      if (isMobileView.value) {
          mobileVisibleSection.value = 'sidebar';
          console.log("[ChatView] Vue Mobile: Bascule vers 'sidebar'");
      }
  };


  // --- NOUVEAU: Gestion du Redimensionnement ---
  const handleResize = () => {
      const currentlyMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (isMobileView.value !== currentlyMobile) {
          console.log(`[ChatView] Changement de mode: ${isMobileView.value ? 'Mobile' : 'Desktop'} -> ${currentlyMobile ? 'Mobile' : 'Desktop'}`);
          isMobileView.value = currentlyMobile;
          // Si on passe en vue mobile
          if (currentlyMobile) {
              // Si une conversation était sélectionnée, on affiche le chat, sinon la liste
              mobileVisibleSection.value = selectedConversation.value ? 'sidebar' : 'sidebar';
              console.log(`[ChatView] Passage en Mobile, vue affichée: ${mobileVisibleSection.value}`);
          }
          // Si on passe en vue desktop, les classes CSS feront le travail, mobileVisibleSection n'est plus prioritaire
      }
  };

  // --- Filtre pour la recherche de conversations (inchangé) ---
  const filteredConversations = computed(() => {
    // Pour l'instant, retourne toutes les conversations. Tu pourrais ajouter un input de recherche ici.
    return conversations.value;
  });

  // --- Cycle de vie (MODIFIÉ pour handleResize) ---
  onMounted(async () => {
    console.log("[ChatView] Montage du composant...");
    loadTheme();

    // *** AJOUT RESPONSIVE ***
    window.addEventListener('resize', handleResize);
    handleResize(); // Appel initial pour définir l'état isMobileView/mobileVisibleSection

    await fetchCurrentUser();

    if (currentUser.value?.id) {
      console.log("[ChatView] Utilisateur chargé, initialisation Socket et données...");
      initSocket();
      setupSocketListeners();
      fetchConversations();
    } else {
        console.error("[ChatView] Échec du chargement de l'utilisateur, initialisation interrompue.");
        // initError est déjà défini dans fetchCurrentUser
    }
  });

  onUnmounted(() => {
    console.log("[ChatView] Démontage du composant, nettoyage...");
    // *** AJOUT RESPONSIVE ***
    window.removeEventListener('resize', handleResize); // Nettoyer l'écouteur

    // Nettoyage Socket (inchangé)
    if (socket.value) {
      socket.value.off('newMessage', handleNewMessage);
      socket.value.off('connect');
      socket.value.off('disconnect');
      socket.value.off('connect_error');
      if (selectedConversation.value) {
          leaveConversationRoom(selectedConversation.value.id);
      }
    }
    disconnectSocket(); // Déconnecter proprement
    clearTimeout(searchTimeout); // Nettoyer timeout de recherche
  });

  // Fonction pour réessayer l'initialisation (inchangée)
  const retryInitialization = async () => {
      console.log("[ChatView] Tentative de réinitialisation...");
      await fetchCurrentUser();
       if (currentUser.value?.id) {
          initSocket();
          setupSocketListeners();
          fetchConversations();
      }
  };

  // --- Watchers (inchangés) ---
  watch(messages, () => { scrollToBottom('auto'); }, { deep: true });
  watch(selectedConversation, (newVal, oldVal) => {
      if (newVal?.id !== oldVal?.id) {
          scrollToBottom('auto'); // Scroll quand on change de conv
          if (newVal === null && isMobileView.value) {
              // Si on désélectionne explicitement et qu'on est sur mobile, revenir à la liste
              mobileVisibleSection.value = 'sidebar';
          }
      }
  });
   watch(newMessage, (newVal) => {
      if (newVal === '') {
          nextTick(adjustTextareaHeight); // Réajuste si vidé manuellement
      }
    });

 // Exposer tout ce qui est nécessaire au template (implicite avec <script setup>)
 // Les nouvelles variables (isMobileView, mobileVisibleSection) et fonctions (showConversationList, showSidebar) sont automatiquement exposées.

</script>
  
<style scoped>
  /* --- Variables CSS pour Thèmes --- */
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-tertiary: #e9ecef;
    --text-primary: #212529;
    --text-secondary: #6c757d;
    --accent-color: #007bff;
    --accent-text-color: #ffffff;
    --border-color: #dee2e6;
    --hover-bg: #e9ecef;
    --active-bg: #d4dadf;
    --scrollbar-thumb: #ced4da;
    --scrollbar-track: var(--bg-tertiary);
    --my-message-bg: #dcf8c6;
    --other-message-bg: #ffffff;
    --message-text: #303030;
    --modal-overlay-bg: rgba(0, 0, 0, 0.5);
    --modal-content-bg: var(--bg-primary);
    --input-bg: #ffffff;
    --link-color: #007bff;
  }
  
  .dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --bg-tertiary: #3a3a3a;
    --text-primary: #e4e6eb;
    --text-secondary: #b0b3b8;
    --accent-color: #3b82f6; /* Bleu un peu plus vif */
    --accent-text-color: #ffffff;
    --border-color: #444444;
    --hover-bg: #3a3a3a;
    --active-bg: #4a4a4a;
    --scrollbar-thumb: #6c757d;
    --scrollbar-track: var(--bg-tertiary);
    --my-message-bg: #056162;
    --other-message-bg: #3a3a3a;
    --message-text: #e4e6eb;
    --modal-overlay-bg: rgba(0, 0, 0, 0.7);
    --modal-content-bg: var(--bg-secondary);
    --input-bg: #3a3a3a;
     --link-color: #60a5fa;
  }
  
  /* --- Styles Généraux --- */
  .chat-view {
    display: flex;
    height: calc(100vh - 60px); /* Ajustez selon la hauteur de votre barre de navigation */
    overflow: hidden;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.3s, color 0.3s;
  }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--scrollbar-track); border-radius: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
  
  /* --- Overlays Chargement/Erreur --- */
  .loading-overlay, .error-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    background-color: var(--modal-overlay-bg); /* Utilise la variable modale */
    color: var(--text-primary); /* S'assurer que le texte est visible */
    z-index: 1001; /* Au-dessus de la modale potentielle */
    text-align: center; padding: 20px;
  }
  .error-overlay p { margin-bottom: 15px; }
  .error-overlay button {
      padding: 8px 15px; cursor: pointer; border-radius: 5px;
      background-color: var(--accent-color); color: var(--accent-text-color); border: none;
  }
  .error-overlay button:hover { opacity: 0.9; }
  
  /* --- Sidebar --- */
  .sidebar {
    width: 300px; flex-shrink: 0; /* Empêche de rétrécir */
    border-right: 1px solid var(--border-color);
    display: flex; flex-direction: column;
    background-color: var(--bg-secondary);
    transition: background-color 0.3s, border-color 0.3s;
  }
  
  .sidebar-header {
    padding: 10px 15px; height: 60px; /* Hauteur fixe pour alignement */
    border-bottom: 1px solid var(--border-color);
    display: flex; justify-content: space-between; align-items: center;
    flex-shrink: 0;
  }
  .sidebar-header .user-info-header {
      display: flex; align-items: center; gap: 10px;
      font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sidebar-header .avatar-small { width: 32px; height: 32px; flex-shrink: 0; margin-right: 0; }
  .theme-toggle {
    background: none; border: none; font-size: 1.5em; cursor: pointer; padding: 0 5px;
    color: var(--text-primary); flex-shrink: 0;
  }
  
  .conversations-list {
    flex-grow: 1; overflow-y: auto;
  }
  .conversations-list ul { list-style: none; padding: 0; margin: 0; }
  .conversation-item {
    display: flex; align-items: center; padding: 12px 15px; cursor: pointer;
    border-bottom: 1px solid var(--border-color); transition: background-color 0.2s; min-height: 70px;
  }
  .conversation-item:hover { background-color: var(--hover-bg); }
  .conversation-item.active { background-color: var(--active-bg); }
  .avatar {
    width: 45px; height: 45px; border-radius: 50%; margin-right: 12px; object-fit: cover;
    background-color: var(--bg-tertiary); flex-shrink: 0;
  }
  .conversation-info { flex-grow: 1; overflow: hidden; padding-right: 5px; }
  .conversation-info .name { font-weight: 600; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .conversation-info .last-message { font-size: 0.9em; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; display: block;}
  .conversation-meta { margin-left: 10px; text-align: right; font-size: 0.8em; color: var(--text-secondary); display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0;}
  .conversation-meta .timestamp { margin-bottom: 4px; white-space: nowrap;}
  .unread-badge { background-color: var(--accent-color); color: var(--accent-text-color); border-radius: 50%; padding: 2px 6px; font-size: 0.75em; font-weight: bold; min-width: 20px; text-align: center; }
  .loading-placeholder, .empty-placeholder { padding: 20px; text-align: center; color: var(--text-secondary); }
  .empty-placeholder.small { font-size: 0.9em; padding: 10px;}
  
  .new-conversation-btn {
      margin: 10px 15px; padding: 10px; border-radius: 8px; background-color: var(--accent-color);
      color: var(--accent-text-color); border: none; cursor: pointer; font-weight: 600; text-align: center; flex-shrink: 0;
  }
  .new-conversation-btn:hover { opacity: 0.9; }
  
  /* --- Chat Area --- */
  .chat-area { flex-grow: 1; display: flex; flex-direction: column; background-color: var(--bg-primary); }
  .no-conversation-selected { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; color: var(--text-secondary); }
  .no-conversation-selected img { margin-bottom: 20px; opacity: 0.6; max-width: 100px;}
  .chat-content { display: flex; flex-direction: column; height: 100%; }
  .chat-header { height: 60px; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid var(--border-color); background-color: var(--bg-secondary); flex-shrink: 0; }
  .chat-header .avatar { width: 38px; height: 38px; } /* Un peu plus petit dans le header */
  .chat-header h3 { margin: 0; margin-left: 10px; font-size: 1.1em; }
  
  .message-input-area { display: flex; padding: 10px 15px; border-top: 1px solid var(--border-color); background-color: var(--bg-secondary); flex-shrink: 0; align-items: flex-end; /* Aligner bouton et textarea en bas */ }
  .message-input-area textarea { flex-grow: 1; padding: 10px 15px; border: 1px solid var(--border-color); border-radius: 20px; resize: none; overflow-y: auto; min-height: 24px; line-height: 1.4; margin-right: 10px; background-color: var(--input-bg); color: var(--text-primary); transition: background-color 0.3s, color 0.3s, border-color 0.3s; max-height: 120px; }
  .message-input-area button { height: 44px; /* Hauteur fixe pour correspondre au textarea initial */ padding: 0 15px; border: none; background-color: var(--accent-color); color: var(--accent-text-color); border-radius: 20px; cursor: pointer; font-weight: 600; transition: background-color 0.2s; flex-shrink: 0; }
  .message-input-area button:hover:not(:disabled) { opacity: 0.9; }
  .message-input-area button:disabled { background-color: var(--text-secondary); cursor: not-allowed; opacity: 0.7; }
  
  /* --- Modale Nouvelle Conversation --- */
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--modal-overlay-bg); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background-color: var(--modal-content-bg); padding: 25px; border-radius: 8px; width: 90%; max-width: 400px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 5px 15px rgba(0,0,0,0.2);}
  .modal-content h3 { margin-top: 0; margin-bottom: 20px; text-align: center; }
  .modal-content input[type="search"] { width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 5px; background-color: var(--input-bg); color: var(--text-primary); }
  .user-search-results-container { flex-grow: 1; overflow-y: auto; min-height: 100px; /* Espace minimum même si vide */ border: 1px solid var(--border-color); border-radius: 5px; margin-bottom: 15px;}
  .user-search-results { list-style: none; padding: 0; margin: 0; }
  .user-search-results li { display: flex; align-items: center; padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border-color); }
  .user-search-results li:last-child { border-bottom: none; }
  .user-search-results li:hover { background-color: var(--hover-bg); }
  .avatar-small { width: 30px; height: 30px; border-radius: 50%; margin-right: 10px; object-fit: cover; background-color: var(--bg-tertiary); flex-shrink: 0; }
  .user-search-results li span { margin-left: 5px; }
  .user-search-results li span:last-of-type { font-size: 0.9em; color: var(--text-secondary); margin-left: auto; /* Pousse à droite */ padding-left: 10px; }
  .close-modal-btn { padding: 10px 15px; border: none; background-color: var(--text-secondary); color: white; border-radius: 5px; cursor: pointer; margin-top: auto; /* Pousse le bouton en bas */ align-self: center; /* Centre le bouton */ }
  .close-modal-btn:hover { opacity: 0.8; }
  

  /* Styles généraux pour le conteneur et les messages */
  .messages-container {
    display: flex;
    flex-direction: column;
    padding: 10px;
    overflow-y: auto;
    height: calc(100% - 120px);
  }

  .message {
    display: flex;
    margin-bottom: 10px;
    max-width: 75%; 
  }

  .message .message-bubble {
    padding: 8px 20px;
    border-radius: 18px;
    word-wrap: break-word;
    position: relative;
  }

  .message-content p {
    margin: 0 0 5px 0;
    font-size: 1rem;
  }

  .message-content .timestamp {
    font-size: 0.75rem;
    color: #888;
    display: block;
    text-align: right;
  }

  /* --- Styles spécifiques pour VOS messages --- */
  .my-message {
    align-self: flex-end; 
    margin-left: auto; 
  }

  .my-message .message-bubble {
    background-color: #dcf8c6; 
    color: #333;
    border: 1px solid #eee;
    border-radius: 18px 18px 5px 18px;
  }

  .my-message .message-content .timestamp {
    color: #6aa06a;
  }


  /* --- Styles spécifiques pour les messages des AUTRES --- */
  .other-message {
    align-self: flex-start;
    margin-right: auto;
  }

  .other-message .message-bubble {
    background-color: #ffffff;
    border: 1px solid #eee;
    color: #333;
    border-radius: 18px 18px 18px 5px; /* Arrondi différent pour indiquer l'origine */
  }


  .message-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      margin-top: 0;
  }

  .other-message .message-content {
    flex-grow: 1;
  }

  /* Nom de l'expéditeur dans les groupes */
  .other-message .sender-name {
      font-size: 0.8rem;
      font-weight: bold;
      color: #555;
      margin-bottom: 3px;
      display: block;
  }


/* --- Styles Responsives --- */
@media (max-width: 768px) {
  
  .chat-view{
    display: block;
    height: 100vh;
    overflow: hidden;
  }
  .sidebar {
    width: 100%; 
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    border-right: none; 
    transition: transform 0.3s ease-in-out; 
    transform: translateX(-100%);
    display: flex;
    flex-direction: column;
    background-color: var(--bg-secondary); 
    max-height: 100vh; 

  }

  .sidebar.visible {
    transform: translateX(0); /* La rend visible */
  }

  .new-conversation-btn {
    flex-shrink: 0;
     margin: 5px 10px;
     padding: 10px;
  }

  .chat-area {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    transition: transform 0.3s ease-in-out;
    transform: translateX(100%);
  }
  
  .chat-area.visible {
     transform: translateX(0); /* La rend visible */
  }

  /* Ajustements pour la zone de messages et l'input sur mobile */
  .messages-container {
    flex-grow: 1;
    overflow-y: auto;
  }
  .chat-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden; /* Optionnel mais bon */
  }
  /* On ajoute un bouton retour dans le header du chat */
  .chat-header {
    position: relative;
  }

  .back-to-conversations-btn {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 5px;
    display: block;
  }

  .sidebar-toggle-btn { 
     display: block; 
     position: absolute;
     top: 15px; 
     left: 15px;
     background: none;
     border: none;
     font-size: 1.8em;
     cursor: pointer;
     color: var(--text-primary);
     z-index: 5; 
  }

  .message-input-area {
    flex-shrink: 0;
    display: flex; 
    padding: 10px 15px; 
  }

  /* Ajustements potentiels pour la modale sur mobile */
  .modal-content {
    width: 95%; 
    max-height: 90vh;
  }
  
  /* Ajustement taille message bubble sur mobile */
   .message {
      max-width: 85%;
   }
   .my-message .message-bubble {
      right: 0;

   }
    .other-message .message-bubble {
      padding: 10px 12px; 
    }


  /* Cacher les boutons de toggle sur grand écran */
  @media (min-width: 769px) {
    .back-to-conversations-btn,
    .sidebar-toggle-btn {
      display: none;
    }
     .sidebar {
        transform: translateX(0);
        position: relative;
        left: auto;
        top: auto;
        width: 300px;
        height: auto;
        border-right: 1px solid var(--border-color);
     }
     .chat-area {
         transform: translateX(0);
         position: relative;
         left: auto;
         top: auto;
         width: auto;
         height: auto;
     }
     .chat-view {
         display: flex;
         height: calc(100vh - 60px);
     }
  }


  
    
    /* Rendre le bouton nouvelle conversation moins proéminent si besoin */
    /* .new-conversation-btn {
        margin: 5px 10px;
        padding: 8px;
    } */

}
</style>