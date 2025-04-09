// src/utils/adminAuth.js

/**
 * Récupère le token d'authentification de l'administrateur depuis le stockage local.
 * @returns {string | null} Le token JWT de l'admin ou null s'il n'est pas trouvé.
 */
export const getAdminAuthToken = () => {
    // Utilise une clé spécifique pour le token admin pour le différencier
    // du token utilisateur normal.
    const token = localStorage.getItem('adminAuthToken'); // <-- NOM DE LA CLÉ IMPORTANTE
    if (!token) {
      console.warn("[adminAuth] Admin token ('adminAuthToken') not found in localStorage.");
    }
    return token;
  };
  
  /**
   * Enregistre le token d'authentification de l'administrateur dans le stockage local.
   * @param {string} token - Le token JWT à enregistrer.
   */
  export const setAdminAuthToken = (token) => {
    if (!token) {
      console.error("[adminAuth] Attempted to set an empty admin token.");
      return;
    }
    localStorage.setItem('adminAuthToken', token); // <-- Utilise le même nom de clé
    console.log("[adminAuth] Admin token saved to localStorage.");
  };
  
  /**
   * Supprime le token d'authentification de l'administrateur du stockage local.
   */
  export const removeAdminAuthToken = () => {
    localStorage.removeItem('adminAuthToken'); // <-- Utilise le même nom de clé
    console.log("[adminAuth] Admin token removed from localStorage.");
  };
  
  /**
   * Vérifie si un token admin (même basique) existe.
   * ATTENTION : Ne vérifie PAS la validité ou l'expiration.
   * À remplacer par une vraie validation de token dans un scénario réel.
   * @returns {boolean}
   */
  export const isAdminLoggedIn = () => {
    return !!getAdminAuthToken();
  };
  
  // Vous pourriez ajouter ici une fonction pour décoder et valider le token JWT admin
  // en utilisant une bibliothèque comme 'jwt-decode' ou 'jose'.
  // export const validateAdminToken = (token) => { ... }