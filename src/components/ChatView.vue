<template>
    <!-- État de chargement initial ou erreur -->
    <div v-if="loadingUser" class="loading-overlay">
      <p>Chargement de vos informations...</p>
      <!-- Ajoutez un spinner ici si vous voulez -->
    </div>
    <div v-else-if="initError" class="error-overlay">
      <p>Erreur d'initialisation : {{ initError }}</p>
      <button @click="retryInitialization">Réessayer</button>
    </div>
  
    <!-- Contenu principal du chat (affiché si pas d'erreur et utilisateur chargé) -->
    <div v-else class="chat-view" :class="theme">
      <!-- Colonne Latérale -->
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="user-info-header">
             <img :src="formatAvatarUrl(currentUser?.avatar)" alt="Mon Avatar" class="avatar-small"/>
             <span>{{ currentUser?.username || 'Utilisateur' }}</span>
          </div>
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
              </div>
            </li>
          </ul>
        </div>
         <button @click="startNewConversation" class="new-conversation-btn">
              Nouvelle Conversation (+)
          </button>
      </div>
  
      <!-- Zone Principale (Chat Actif) -->
      <div class="chat-area">
        <div v-if="selectedConversation" class="chat-content">
          <div class="chat-header">
            <img :src="getConversationAvatar(selectedConversation)" alt="Avatar" class="avatar" />
            <h3>{{ getConversationName(selectedConversation) }}</h3>
          </div>
  
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
                :class="{ 'my-message': message.senderId === currentUser?.id, 'other-message': message.senderId !== currentUser?.id }"
              >
                <div class="message-bubble">
                   <img
                      v-if="selectedConversation.is_group && message.senderId !== currentUser?.id"
                      :src="formatAvatarUrl(message.sender?.avatar)"
                      alt="Sender Avatar"
                      class="message-avatar"
                   />
                  <div class="message-content">
                    <span v-if="selectedConversation.is_group && message.senderId !== currentUser?.id" class="sender-name">
                        {{ message.sender?.username || 'Utilisateur inconnu' }}
                    </span>
                    <p>{{ message.content }}</p>
                    <span class="timestamp">{{ formatTimestamp(message.createdAt, true) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
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
              Envoyer
            </button>
          </div>
        </div>
  
        <div v-else class="no-conversation-selected">
          <img src="/img/chat-placeholder-icon.svg" alt="Chat icon" width="100"/>
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
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import axios from 'axios'; // Assurez-vous qu'axios est configuré (token interceptor, etc.)
  import { initSocket, getSocket, joinConversationRoom, leaveConversationRoom, sendMessage as sendSocketMessage, disconnectSocket } from '@/services/socket'; // Ajustez le chemin
  
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
  
  // --- Constantes & Configuration ---
  const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app'; // Ex: http://localhost:5000
  const DEFAULT_AVATAR = '/img/default-avatar.png';
  const GROUP_AVATAR = '/img/group-avatar.png';
  
  // --- Fonctions ---
  
  const formatAvatarUrl = (avatarPath) => {
       if (!avatarPath) return DEFAULT_AVATAR;
       if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
           return avatarPath;
       }
       return `${API_BASE_URL}${avatarPath}`; // Assurez-vous que le path commence par / si API_BASE_URL est défini
  };
  
  const fetchCurrentUser = async () => {
    loadingUser.value = true;
    initError.value = null;
    try {
      const response = await axios.get('/api/auth/me'); // URL de votre API /me
      if (response.data.status === 'success' && response.data.data.user) {
        currentUser.value = response.data.data.user;
        console.log('Utilisateur actuel chargé:', currentUser.value?.id);
      } else {
        throw new Error('Format de réponse invalide depuis /api/auth/me');
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur connecté:", error.response?.data || error.message);
      if (error.response?.status === 401) {
           initError.value = "Session expirée ou invalide. Veuillez vous reconnecter.";
           // Envisager une déconnexion globale / redirection vers login
      } else {
          initError.value = "Impossible de charger vos informations utilisateur.";
      }
      currentUser.value = null;
    } finally {
      loadingUser.value = false;
    }
  };
  
  
  const setupSocketListeners = () => {
    socket.value = getSocket();
    if (socket.value) {
      socket.value.off('newMessage'); // Nettoyer ancien listener avant d'en ajouter un nouveau
      socket.value.off('connect');
      socket.value.off('disconnect');
      socket.value.off('connect_error');
  
      socket.value.on('newMessage', handleNewMessage);
      socket.value.on('connect', () => console.log('[ChatView] Socket re-connecté!'));
      socket.value.on('disconnect', (reason) => console.warn(`[ChatView] Socket déconnecté: ${reason}`));
      socket.value.on('connect_error', (err) => {
          console.error('[ChatView] Erreur connexion Socket:', err.message);
          if (err.message.toLowerCase().includes('auth')) {
               initError.value = "Erreur d'authentification WebSocket. Rechargez la page ou reconnectez-vous.";
               // On pourrait forcer une déconnexion ici
          } else {
              initError.value = "Erreur connexion temps réel.";
          }
      });
      console.log("[ChatView] Écouteurs Socket configurés.");
    } else {
      console.error("[ChatView] Impossible de configurer les écouteurs: Socket non initialisé.");
      initError.value = "La connexion temps réel n'a pu être établie.";
    }
  };
  
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('chatTheme') || 'light';
    theme.value = savedTheme;
  };
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('chatTheme', theme.value);
  };
  
  const fetchConversations = async () => {
    if (!currentUser.value) return;
    loadingConversations.value = true;
    try {
      // Appel API réel
      const response = await axios.get('/api/conversations');
      conversations.value = response.data.data.conversations || [];
      // Trier par date du dernier message ou date de mise à jour
       conversations.value.sort((a, b) => {
          // Utiliser la date du dernier message si elle existe, sinon la date de màj de la conv
          const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
          const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
          return dateB - dateA; // Plus récent en premier
       });
       console.log(`[ChatView] ${conversations.value.length} conversations chargées.`);
  
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error.response?.data || error.message);
      // Afficher une notification d'erreur à l'utilisateur (ex: avec une librairie de toast)
    } finally {
      loadingConversations.value = false;
    }
  };
  
  const fetchMessages = async (conversationId) => {
    if (!conversationId || !currentUser.value) return;
    loadingMessages.value = true;
    messages.value = [];
    try {
      // Appel API réel (assumer que l'API renvoie les messages du plus ancien au plus récent pour l'historique)
      const response = await axios.get(`/api/conversations/${conversationId}/messages`);
      messages.value = response.data.data.messages || [];
      console.log(`[ChatView] ${messages.value.length} messages chargés pour ${conversationId}.`);
      await nextTick(); // Attendre le rendu avant de scroller
      scrollToBottom('auto'); // Scroll instantané après chargement initial
    } catch (error) {
      console.error(`Erreur lors de la récupération des messages pour ${conversationId}:`, error.response?.data || error.message);
      // Afficher une notification d'erreur
    } finally {
        loadingMessages.value = false;
    }
  };
  
  const selectConversation = (conversation) => {
     if (!currentUser.value || loadingMessages.value) return;
     if (selectedConversation.value?.id === conversation.id) return;
  
     console.log(`[ChatView] Sélection de la conversation: ${conversation.id}`);
  
     // Quitter l'ancienne room
     if (selectedConversation.value && socket.value) {
          console.log(`[ChatView] Quitte la room ${selectedConversation.value.id}`);
          leaveConversationRoom(selectedConversation.value.id);
     }
  
     selectedConversation.value = conversation;
     fetchMessages(conversation.id); // Lance le chargement des messages
  
     // Rejoindre la nouvelle room
     if (socket.value) {
          console.log(`[ChatView] Rejoignant la room ${conversation.id}`);
          joinConversationRoom(conversation.id);
     } else {
          console.warn("[ChatView] Socket non disponible pour rejoindre la room");
          // On pourrait afficher une erreur ici
     }
  };
  
  const handleSendMessage = () => {
    if (!newMessage.value.trim() || !selectedConversation.value || !socket.value || !currentUser.value || loadingMessages.value) {
        if (!socket.value) console.error("Impossible d'envoyer: Socket non connecté.");
        return;
    }
    console.log(`[ChatView] Tentative d'envoi message à ${selectedConversation.value.id}`);
    const messageData = {
      conversationId: selectedConversation.value.id,
      content: newMessage.value.trim(),
    };
    sendSocketMessage(messageData); // Envoyer via WebSocket
    newMessage.value = '';
    adjustTextareaHeight();
    nextTick(() => { // Assurer que l'input est visible avant de focus
         messageInputRef.value?.focus();
    });
  };
  
  const handleNewMessage = (message) => {
     if (!currentUser.value || !message || !message.conversationId) {
          console.warn("[ChatView] Nouveau message reçu invalide ou utilisateur non chargé", message);
          return;
     }
     console.log(`[ChatView] Nouveau message (${message.id}) reçu pour conv ${message.conversationId}`);
  
     // Mettre à jour la conversation active si c'est la bonne
     if (selectedConversation.value && message.conversationId === selectedConversation.value.id) {
       // Vérifier si le message n'est pas déjà dans la liste (évite doublons si optimistic UI était utilisé)
       if (!messages.value.some(m => m.id === message.id)) {
          messages.value.push(message);
          scrollToBottom('smooth'); // Défilement doux pour les nouveaux messages arrivant
       }
     }
  
     // Mettre à jour l'aperçu dans la liste des conversations
     const convIndex = conversations.value.findIndex(c => c.id === message.conversationId);
     if (convIndex > -1) {
         const updatedConv = conversations.value[convIndex];
         updatedConv.lastMessage = { // Utiliser les données du message reçu
             id: message.id,
             content: message.content,
             createdAt: message.createdAt,
             senderId: message.senderId,
             // Inclure l'expéditeur si l'API/socket le fournit
             sender: message.sender || updatedConv.lastMessage?.sender
         };
         // Mettre à jour la date de màj de la conv pour le tri
         updatedConv.updatedAt = message.createdAt;
  
         // Déplacer la conversation mise à jour en haut de la liste
         conversations.value.splice(convIndex, 1);
         conversations.value.unshift(updatedConv);
         console.log(`[ChatView] Aperçu conversation ${message.conversationId} mis à jour.`);
     } else {
         // Si c'est une nouvelle conversation pour cet utilisateur
         console.warn(`[ChatView] Nouveau message reçu pour une conversation non listée: ${message.conversationId}. Recharge de la liste.`);
         // Solution simple: recharger la liste complète
         fetchConversations();
         // TODO: Solution idéale: avoir un event 'newConversation' du backend qui envoie la nouvelle conversation complète
     }
  };
  
  const scrollToBottom = (behavior = 'smooth') => {
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
    const textarea = messageInputRef.value;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 120;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  };
  
  const formatTimestamp = (timestamp, full = false) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      // Comparaison basée sur la date uniquement (ignorer l'heure)
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
      console.error("Erreur formatage timestamp:", timestamp, e);
      return ''; // Retourner une chaîne vide en cas d'erreur
    }
  };
  
  
  const truncate = (text, length) => {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
  }
  
  const getOtherParticipant = (conv) => {
      if (!conv || !conv.participants || !currentUser.value) return null;
      return conv.participants.find(p => p.id !== currentUser.value?.id);
  }
  
  const getConversationName = (conv) => {
      if (!conv) return '';
      if (conv.is_group) return conv.name || 'Groupe sans nom';
      const other = getOtherParticipant(conv);
      // Utiliser le username comme fallback si fullName n'est pas défini
      return other?.fullName || other?.username || 'Utilisateur inconnu';
  }
  
  const getConversationAvatar = (conv) => {
       if (!conv) return DEFAULT_AVATAR;
       if (conv.is_group) return GROUP_AVATAR;
       const other = getOtherParticipant(conv);
       return formatAvatarUrl(other?.avatar);
  };
  
  // --- Fonctions Modale Nouvelle Conversation ---
  const startNewConversation = () => {
      showNewConversationModal.value = true;
      userSearchQuery.value = '';
      searchResults.value = [];
  }
  
  const closeNewConversationModal = () => {
      showNewConversationModal.value = false;
  }
  
  const searchUsers = () => { // La logique async/debounce est à l'intérieur
      clearTimeout(searchTimeout);
      if (!userSearchQuery.value.trim()) {
          searchResults.value = [];
          searchingUsers.value = false; // Assurer que searching est false si vide
          return;
      }
      searchingUsers.value = true;
      searchTimeout = setTimeout(async () => {
          try {
               // Appel API réel
               console.log(`[ChatView] Recherche utilisateurs: "${userSearchQuery.value}"`);
               const response = await axios.get(`/api/conversations/find-users?search=${encodeURIComponent(userSearchQuery.value)}`);
               searchResults.value = response.data.data.users || [];
               console.log(`[ChatView] ${searchResults.value.length} utilisateurs trouvés.`);
          } catch (error) {
              console.error("Erreur lors de la recherche d'utilisateurs:", error.response?.data || error.message);
              searchResults.value = [];
              // Afficher une erreur dans la modale ?
          } finally {
              searchingUsers.value = false;
          }
      }, 400); // Debounce de 400ms
  }
  
  const createOrGoToConversation = async (user) => {
       if (!currentUser.value) return;
       console.log(`[ChatView] Initialisation conversation avec: ${user.username} (ID: ${user.id})`);
       closeNewConversationModal(); // Fermer la modale
  
       try {
            // 1. Vérifier si une conversation 1-1 existe déjà localement
            const existingConv = conversations.value.find(c =>
               !c.is_group &&
               c.participants.length === 2 &&
               c.participants.some(p => p.id === user.id) &&
               c.participants.some(p => p.id === currentUser.value?.id)
            );
  
            if (existingConv) {
                console.log(`[ChatView] Conversation existante trouvée (${existingConv.id}), sélection...`);
                selectConversation(existingConv);
                return;
            }
  
           // 2. Si non, créer la conversation via l'API
           console.log(`[ChatView] Aucune conversation existante trouvée, création via API...`);
           const response = await axios.post('/api/conversations', {
               participantIds: [user.id] // Envoyer l'ID de l'autre utilisateur
           });
           const newConvData = response.data.data.conversation;
  
           if (newConvData && newConvData.id) {
              console.log(`[ChatView] Nouvelle conversation créée (${newConvData.id}). Ajout à la liste et sélection.`);
              // Ajouter la nouvelle conversation en haut de la liste locale
              conversations.value.unshift(newConvData);
              // Sélectionner immédiatement la nouvelle conversation
              selectConversation(newConvData);
           } else {
               throw new Error("La réponse de l'API pour la création de conversation est invalide.");
           }
  
       } catch (error) {
           console.error("Erreur lors de la création/sélection de la conversation:", error.response?.data || error.message);
           // Afficher une notification d'erreur à l'utilisateur
           alert("Impossible de démarrer la conversation. Veuillez réessayer."); // Simple alert pour l'exemple
       }
  }
  
  // --- Filtre (pas utilisé activement dans cet exemple) ---
  const filteredConversations = computed(() => {
    return conversations.value;
  });
  
  // --- Cycle de vie ---
  onMounted(async () => {
    console.log("[ChatView] Montage du composant...");
    loadTheme();
    await fetchCurrentUser();
  
    if (currentUser.value?.id) {
      console.log("[ChatView] Utilisateur chargé, initialisation Socket et données...");
      initSocket(currentUser.value.id);
      setupSocketListeners();
      fetchConversations();
    } else {
        console.error("[ChatView] Échec du chargement de l'utilisateur, initialisation interrompue.");
        // L'erreur est affichée via initError dans le template
    }
  });
  
  onUnmounted(() => {
    console.log("[ChatView] Démontage du composant, nettoyage...");
    if (socket.value) {
      // Nettoyer tous les listeners spécifiques à ce composant
      socket.value.off('newMessage', handleNewMessage);
      socket.value.off('connect');
      socket.value.off('disconnect');
      socket.value.off('connect_error');
      // Si on quitte la vue chat, quitter la room sélectionnée
      if (selectedConversation.value) {
          leaveConversationRoom(selectedConversation.value.id);
      }
    }
    // Déconnecter le socket pour libérer les ressources serveur
    disconnectSocket();
  });
  
  // Fonction pour réessayer l'initialisation
  const retryInitialization = async () => {
      console.log("[ChatView] Tentative de réinitialisation...");
      await fetchCurrentUser();
       if (currentUser.value?.id) {
          initSocket(currentUser.value.id);
          setupSocketListeners();
          fetchConversations();
      }
  };
  
  // Watchers
  watch(messages, () => { scrollToBottom('auto'); }, { deep: true });
  watch(selectedConversation, (newVal, oldVal) => {
      if (newVal?.id !== oldVal?.id) { // Seulement si l'ID change
          scrollToBottom('auto');
      }
  });
  
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
  .messages-container { flex-grow: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; }
  .messages-empty { justify-content: center; align-items: center; }
  .message { margin-bottom: 15px; display: flex; }
  .message-bubble { padding: 10px 15px; border-radius: 18px; max-width: 70%; position: relative; color: var(--message-text); display: flex; align-items: flex-start; }
  .message-content { /* Prend l'espace restant */ }
  .message-avatar { width: 30px; height: 30px; border-radius: 50%; margin-right: 8px; align-self: flex-start; background-color: var(--bg-tertiary); flex-shrink: 0; }
  .sender-name { font-size: 0.8em; font-weight: 600; margin-bottom: 4px; display: block; color: var(--link-color); }
  .message p { margin: 0; line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; /* Préserve les retours à la ligne */ }
  .message .timestamp { font-size: 0.75em; color: var(--text-secondary); margin-top: 5px; display: block; text-align: right; }
  .my-message { justify-content: flex-end; }
  .my-message .message-bubble { background-color: var(--my-message-bg); border-bottom-right-radius: 4px; }
  .other-message { justify-content: flex-start; }
  .other-message .message-bubble { background-color: var(--other-message-bg); border: 1px solid var(--border-color); border-bottom-left-radius: 4px; }
  
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
  
</style>