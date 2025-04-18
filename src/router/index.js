import { createRouter, createWebHistory } from 'vue-router';

// --- Vues Utilisateur Normal ---
import RegisterView from '../views/RegisterView.vue';
import LoginView from '../views/LoginView.vue';
const DashboardView = () => import('../views/Dashboard.vue');
const UserProfile = () => import('../views/UserProfile.vue');
import EditProfile from '../views/EditProfile.vue';
import UserDashboard from '../components/UserDashboard.vue';
import LandingPage from '../components/LandingPage.vue';
import AboutPage from '../views/AboutPage.vue';       // Votre composant À Propos


const ChatView = () => import('../views/ChatView.vue'); // Assurez-vous que le chemin est correct

// --- Vues et Layout Admin ---
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
    name: 'Landing', // Ou 'Home'
    component: LandingPage
  },

  // --- Routes Utilisateur Normal ---
  {
    path: '/register',
    name: 'Register',
    component: RegisterView
    // meta: { guestOnly: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
    // meta: { guestOnly: true }
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profil',
    name: 'UserProfile',
    component: UserProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: EditProfile,
    meta: { requiresAuth: true }
  },

  {
    path: '/chat',
    name: 'Chat',
    component: ChatView,
    meta: { requiresAuth: true } 
  },
  {
    path: '/userdash',
    name: 'UserDash',
    component: UserDashboard,
    meta: { requiresAuth: true } 
  },
  // --- Route Connexion Admin (Optionnelle) ---
  // {
  //   path: '/admin/login',
  //   name: 'AdminLogin',
  //   component: AdminLogin
  // },

  // --- Routes Admin Protégées ---
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdminAuth: true },
    children: [
      { path: '', name: 'AdminRootRedirect', redirect: { name: 'AdminDashboard' } },
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard },
      { path: 'users', name: 'AdminUsers', component: AdminUsers },
      { path: 'reports', name: 'AdminReports', component: AdminReports },
    ]
  },

  // --- Route 404 (Si vous en avez une) ---
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }

];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes, // Utilise le tableau routes mis à jour
});

// --- GARDE DE NAVIGATION GLOBALE (Inchangée - gère déjà requiresAuth) ---
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
       // next({ name: 'AdminLogin' }); // Décommenter si vous avez AdminLogin
       next({ name: 'Login' }); // Ou rediriger vers la connexion générale
    } else {
      console.log("Garde Navigation: Accès Admin autorisé.");
      next(); // Admin authentifié, accès autorisé
    }
  }
  // 2. Logique pour les routes Utilisateur Normal (gère maintenant /chat aussi)
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
  //   console.log("Garde Navigation: Utilisateur connecté, redirection depuis Login/Register vers Dashboard.");
  //   next({ name: 'Dashboard' });
  // }
  else {
    // Route publique ou cas non géré explicitement
    console.log("Garde Navigation: Route publique ou cas non géré explicitement, autorisation.");
    next();
  }
});

export default router;