import { createRouter, createWebHistory } from 'vue-router';
import RegisterView from '../views/RegisterView.vue';

// Vous pouvez garder l'import direct ou utiliser le lazy loading pour toutes
import LoginView from '../views/LoginView.vue';
// Import de la nouvelle vue Dashboard via lazy loading
const DashboardView = () => import('../views/Dashboard.vue');
// --- AJOUT : Importer la vue UserProfile (en lazy loading aussi) ---
const UserProfile = () => import('../views/UserProfile.vue');
import EditProfile from '../views/EditProfile.vue'; // La nouvelle page


const routes = [
  {
    path: '/',
    // Redirection dynamique:
    // - Si l'utilisateur est authentifié (token existe), aller au Dashboard.
    // - Sinon, aller à la page de connexion (Login).
    redirect: () => {
      const isAuthenticated = !!localStorage.getItem('authToken'); // Vérifie la présence du token
      return isAuthenticated ? { name: 'Dashboard' } : { name: 'Login' };
    }
  },
  {
    path: '/register',
    name: 'Register', // Garder le nom
    component: RegisterView
    // meta: { guestOnly: true } // Optionnel
  },
  {
    path: '/login',
    name: 'Login', // Garder le nom
    component: LoginView
    // meta: { guestOnly: true } // Optionnel
  },
  {
    path: '/dashboard', // Chemin pour la page après connexion
    name: 'Dashboard', // Nommer la route est essentiel pour la navigation/redirection
    component: DashboardView,
    meta: { requiresAuth: true } // IMPORTANT: Indique que cette route nécessite une authentification
  },
  // --- AJOUT : Route pour la page de Profil ---
  {
    path: '/profil', // Chemin d'URL pour accéder à la page de profil
    name: 'UserProfile', // Nom unique pour cette route
    component: UserProfile, // Le composant Vue à afficher
    meta: { requiresAuth: true } // Cette page nécessite aussi que l'utilisateur soit connecté
  },
  {
    path: '/edit-profile', // Chemin pour la page d'édition
    name: 'EditProfile',
    component: EditProfile
  },
  { // Redirection par défaut ou page d'accueil
    path: '/',
    redirect: '/dashboard'
  }
  // Ajoutez d'autres routes protégées ou publiques ici si nécessaire
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes, // Utilise le tableau de routes défini ci-dessus
});

// --- GARDE DE NAVIGATION GLOBALE (Navigation Guard) ---
// (Aucune modification nécessaire ici, elle gère déjà le meta: requiresAuth)
router.beforeEach((to, from, next) => {
  // 1. Vérifier si l'utilisateur est authentifié
  const isAuthenticated = !!localStorage.getItem('authToken');

  // 2. Vérifier si la route cible nécessite une authentification
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // 3. Logique de redirection
  if (requiresAuth && !isAuthenticated) {
    // Si Auth requise et non connecté -> Login
    console.log('Navigation Guard: Route nécessite Auth, non authentifié. Redirection vers Login.');
    next({ name: 'Login' });
  } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    // Si connecté et essaie d'aller sur Login/Register -> Dashboard
    console.log('Navigation Guard: Authentifié, accès à Login/Register interdit. Redirection vers Dashboard.');
    next({ name: 'Dashboard' });
  } else {
    // Autoriser la navigation
    console.log('Navigation Guard: Navigation autorisée vers', to.name || to.path);
    next();
  }
});

export default router;