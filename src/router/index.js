import { createRouter, createWebHistory } from 'vue-router';

// --- Vues Utilisateur Normal ---
import RegisterView from '../views/RegisterView.vue';
import LoginView from '../views/LoginView.vue';
const DashboardView = () => import('../views/Dashboard.vue');
const UserProfile = () => import('../views/UserProfile.vue');
import EditProfile from '../views/EditProfile.vue';

// --- Vues et Layout Admin ---  <---- AJOUT
import AdminLayout from '../layouts/AdminLayout.vue'; // Assurez-vous que le chemin est correct
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AdminUsers from '../views/admin/AdminUsers.vue';
import AdminReports from '../views/admin/AdminReports.vue';
// Optionnel : Page de connexion admin séparée
// import AdminLogin from '../views/AdminLogin.vue';

        
// --- Fonctions de Vérification d'Authentification ---

// Vérification pour utilisateur normal (existante)
const isUserAuthenticated = () => {
  return !!localStorage.getItem('authToken'); // Votre logique actuelle
};

// Vérification pour ADMIN (Nouvelle) - !! À SÉCURISER !!
const isAdminAuthenticated = () => {
  // !! EXEMPLE BASIQUE ET INSÉCUR !!
  // À remplacer par une vérification d'un token JWT admin spécifique
  // ou la vérification d'un rôle dans le payload du token utilisateur normal.
  const adminToken = localStorage.getItem('adminAuthToken'); // Exemple de nom de token admin
  console.log("[Auth Check] Admin Token found:", adminToken ? 'Yes' : 'No');
  // Dans une vraie application, vérifiez aussi la validité/expiration du token.
  return !!adminToken;
};


const routes = [
  // --- Redirection initiale ---
  {
    path: '/',
    redirect: () => {
      // Redirige vers Dashboard si user normal connecté, sinon Login
      // Si vous voulez une logique différente pour admin connecté, ajoutez-la ici
      return isUserAuthenticated() ? { name: 'Dashboard' } : { name: 'Login' };
    }
  },

  // --- Routes Utilisateur Normal ---
  {
    path: '/register',
    name: 'Register',
    component: RegisterView
    // meta: { guestOnly: true } // Si vous voulez empêcher les connectés d'y aller
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
    // meta: { guestOnly: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true } // Nécessite authentification utilisateur normal
  },
  {
    path: '/profil',
    name: 'UserProfile',
    component: UserProfile,
    meta: { requiresAuth: true } // Nécessite authentification utilisateur normal
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: EditProfile,
    meta: { requiresAuth: true } // Probablement aussi protégé
  },

  // --- Route Connexion Admin (Optionnelle) --- <---- AJOUT
  // {
  //   path: '/admin/login',
  //   name: 'AdminLogin',
  //   component: AdminLogin // Assurez-vous d'importer AdminLogin
  // },

  // --- Routes Admin Protégées --- <---- AJOUT
  {
    path: '/admin',
    component: AdminLayout,           // Utilise le layout admin
    meta: { requiresAdminAuth: true }, // Marqueur pour la protection ADMIN
    children: [
      // Redirection de /admin vers /admin/dashboard
      { path: '', name: 'AdminRootRedirect', redirect: { name: 'AdminDashboard' } },
      // Tableau de bord Admin
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard },
      // Gestion Utilisateurs Admin
      { path: 'users', name: 'AdminUsers', component: AdminUsers },
      // Gestion Signalements Admin
      { path: 'reports', name: 'AdminReports', component: AdminReports },
      // Ajouter d'autres vues admin ici
    ]
  },

  // --- Route 404 (Si vous en avez une) ---
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }

];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// --- GARDE DE NAVIGATION GLOBALE (Modifiée) ---
router.beforeEach((to, from, next) => {
  const requiresUser = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdminAuth);
  const isUserAuth = isUserAuthenticated();
  const isAdminAuth = isAdminAuthenticated(); // Vérification spécifique admin

  console.log(`Navigation vers: ${to.path}, requiresUser: ${requiresUser}, requiresAdmin: ${requiresAdmin}, isUserAuth: ${isUserAuth}, isAdminAuth: ${isAdminAuth}`);

  // 1. Logique pour les routes Admin
  if (requiresAdmin) {
    if (!isAdminAuth) {
      console.warn("Garde Navigation: Accès Admin requis mais non authentifié.");
      // Rediriger vers la page de connexion ADMIN (si elle existe) ou une page publique
      next({ name: 'AdminLogin' }); // Assurez-vous que cette route existe
      // Ou next({ name: 'Login' }); // Ou vers la connexion générale
      // Ou next({ name: 'Home' }); // Ou vers l'accueil
    } else {
      console.log("Garde Navigation: Accès Admin autorisé.");
      next(); // Admin authentifié, accès autorisé
    }
  }
  // 2. Logique pour les routes Utilisateur Normal (existante, légèrement ajustée)
  else if (requiresUser) {
    if (!isUserAuth) {
      console.warn("Garde Navigation: Accès Utilisateur requis mais non authentifié.");
      next({ name: 'Login' }); // Rediriger vers la connexion normale
    } else {
      console.log("Garde Navigation: Accès Utilisateur autorisé.");
      next(); // Utilisateur normal authentifié, accès autorisé
    }
  }
   // 3. Logique optionnelle pour les pages "invité seulement" (Login/Register)
  // else if ((to.name === 'Login' || to.name === 'Register') && isUserAuth) {
  //   // Si un utilisateur normal est connecté et essaie d'aller sur Login/Register
  //   console.log("Garde Navigation: Utilisateur connecté, redirection depuis Login/Register vers Dashboard.");
  //   next({ name: 'Dashboard' });
  // }
  // Si vous avez une connexion admin séparée, vous pourriez aussi interdire l'accès à AdminLogin si déjà admin
  // else if (to.name === 'AdminLogin' && isAdminAuth) {
  //    console.log("Garde Navigation: Admin connecté, redirection depuis AdminLogin vers AdminDashboard.");
  //    next({ name: 'AdminDashboard' });
  // }
  else {
    // Route publique ou cas non géré explicitement
    console.log("Garde Navigation: Route publique ou cas non géré explicitement, autorisation.");
    next();
  }
});

export default router;