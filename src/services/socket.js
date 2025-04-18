// src/services/socket.js
import { io } from 'socket.io-client';

let socket = null; // Garde la référence unique du socket

// URL de votre backend Node.js où Socket.IO écoute
const SOCKET_URL = import.meta.env.VUE_APP_SOCKET_URL || 'https://youvoiceapi-production.up.railway.app'; // URL du backend

/**
 * Initialise la connexion Socket.IO.
 */
export const initSocket = () => {
  if (socket && socket.connected) {
    console.log('[Socket Service] Socket déjà connecté.');
    return socket;
  }
   if (socket) {
       console.log('[Socket Service] Tentative de reconnexion du socket existant...');
       socket.connect();
       return socket;
   }

  const token = localStorage.getItem('authToken'); // Récupérer le token
  if (!token) {
    console.error("[Socket Service] ❌ Impossible d'initialiser: Token JWT manquant.");
    return null;
  }

  console.log(`[Socket Service] Initialisation de la connexion vers ${SOCKET_URL}...`);

  socket = io(SOCKET_URL, {
    auth: { token: token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
  });

  // --- Gestionnaires d'événements de base ---
  socket.on('connect', () => console.log(`[Socket Service] ✅ Connecté! ID: ${socket.id}`));
  socket.on('disconnect', (reason) => console.warn(`[Socket Service] 🔌 Déconnecté. Raison: ${reason}`));
  socket.on('connect_error', (err) => console.error(`[Socket Service] 💥 Erreur connexion: ${err.message}`));

  return socket;
};

/**
 * Récupère l'instance du socket actuelle.
 * @returns {import("socket.io-client").Socket | null}
 */
export const getSocket = () => {
  if (!socket) console.warn("[Socket Service] getSocket appelé mais socket non initialisé.");
  return socket;
};

/** Déconnecte explicitement le socket. */
export const disconnectSocket = () => {
  if (socket) {
    console.log('[Socket Service] Déconnexion explicite.');
    socket.disconnect();
    socket = null;
  }
};

// --- Fonctions pour Émettre des Événements ---

export const joinConversationRoom = (conversationId) => {
  if (socket?.connected && conversationId) {
    socket.emit('joinRoom', conversationId);
  } else {
    console.warn("[Socket Service] Échec 'joinRoom': Socket non connecté ou ID manquant.");
  }
};

export const leaveConversationRoom = (conversationId) => {
   if (socket?.connected && conversationId) {
    socket.emit('leaveRoom', conversationId);
  } else {
    console.warn("[Socket Service] Échec 'leaveRoom': Socket non connecté ou ID manquant.");
  }
};

export const sendMessage = (messageData) => {
  if (socket?.connected && messageData?.conversationId && messageData?.content) {
    socket.emit('sendMessage', messageData);
  } else {
     console.warn("[Socket Service] Échec 'sendMessage': Socket non connecté ou données manquantes.");
  }
};