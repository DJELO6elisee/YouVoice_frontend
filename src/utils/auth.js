// src/utils/auth.js

// Clé utilisée dans localStorage pour le token utilisateur normal
const USER_TOKEN_KEY = 'authToken';

/**
 * Récupère le token d'authentification de l'utilisateur normal depuis le stockage local.
 * @returns {string | null} Le token JWT de l'utilisateur ou null s'il n'est pas trouvé.
 */
export const getAuthToken = () => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  // Pas besoin de logguer l'absence ici, c'est souvent vérifié ailleurs
  return token;
};

/**
 * Enregistre le token d'authentification de l'utilisateur normal dans le stockage local.
 * @param {string} token - Le token JWT à enregistrer.
 */
export const setAuthToken = (token) => {
  if (!token) {
    console.error("[Auth Utils] Tentative d'enregistrement d'un token utilisateur vide.");
    // Optionnel: supprimer la clé si le token est vide/null
    // localStorage.removeItem(USER_TOKEN_KEY);
    return;
  }
  localStorage.setItem(USER_TOKEN_KEY, token);
  console.log("[Auth Utils] Token utilisateur ('authToken') enregistré dans localStorage.");
};

/**
 * Supprime le token d'authentification de l'utilisateur normal du stockage local.
 */
export const removeAuthToken = () => {
  localStorage.removeItem(USER_TOKEN_KEY);
  console.log("[Auth Utils] Token utilisateur ('authToken') supprimé de localStorage.");
};

/**
 * Vérifie si un token utilisateur (même basique) existe.
 * ATTENTION : Ne vérifie PAS la validité ou l'expiration du token.
 * Utilisez une validation côté serveur ou une bibliothèque JWT côté client pour cela.
 * @returns {boolean}
 */
export const isUserLoggedIn = () => {
  return !!getAuthToken(); // Renvoie true si le token existe (n'est pas null/undefined)
};

// --- Optionnel: Fonctions liées au User ID ---

const USER_ID_KEY = 'userId'; // Clé pour stocker l'ID utilisateur

/**
 * Récupère l'ID de l'utilisateur stocké localement.
 * @returns {string | null} L'ID utilisateur ou null.
 */
export const getUserId = () => {
    return localStorage.getItem(USER_ID_KEY);
};

/**
 * Enregistre l'ID de l'utilisateur localement.
 * @param {string} userId - L'ID utilisateur à enregistrer.
 */
export const setUserId = (userId) => {
     if (!userId) {
        console.warn("[Auth Utils] Tentative d'enregistrement d'un userId vide.");
        localStorage.removeItem(USER_ID_KEY); // Nettoyer si vide
        return;
     }
     localStorage.setItem(USER_ID_KEY, String(userId)); // S'assurer que c'est une string
     console.log("[Auth Utils] User ID enregistré dans localStorage.");
};

/**
 * Supprime l'ID de l'utilisateur stocké localement.
 */
export const removeUserId = () => {
    localStorage.removeItem(USER_ID_KEY);
     console.log("[Auth Utils] User ID supprimé de localStorage.");
};

// --- Optionnel: Fonction de Déconnexion Complète ---
/**
 * Supprime toutes les informations d'authentification utilisateur.
 */
export const logoutUser = () => {
    removeAuthToken();
    removeUserId();
    // Ajoutez ici la suppression d'autres données utilisateur si nécessaire
    console.log("[Auth Utils] Déconnexion utilisateur effectuée (tokens/ID supprimés).");
}