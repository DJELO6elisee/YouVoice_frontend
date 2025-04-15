<template>
  <div class="dashboard-page"> <!-- Classe racine pour le scoping -->
    <!-- Titre -->
    <h1 class="page-title">Tableau de Bord</h1>

    <!-- Indicateur de Chargement -->
    <div v-if="loading" class="loading-indicator">Chargement...</div>

    <!-- Message d'Erreur -->
    <div v-else-if="error" class="error-message" role="alert">
      <strong>Erreur!</strong>
      <span> {{ error }}</span>
    </div>

    <!-- Contenu Principal (Statistiques et Graphiques) -->
    <div v-else class="dashboard-content">
      <!-- Grille de Statistiques -->
      <div class="stats-grid">
        <!-- Les StatCard reçoivent des props, leur style interne doit aussi être sans Tailwind -->
        <StatCard title="Utilisateurs" :value="stats.totalUsers" icon="fas fa-users" />
        <StatCard title="Notes Vocales" :value="stats.totalVoiceNotes" icon="fas fa-microphone-alt" />
        <!-- La couleur est passée comme prop, StatCard doit l'interpréter sans Tailwind -->
        <StatCard title="Signalements" :value="stats.pendingReports" icon="fas fa-flag" color-class="warning" />
      </div>

      <!-- Grille de Graphiques -->
      <div class="charts-grid">
        <!-- Conteneur pour le graphique Utilisateurs -->
        <div class="chart-container">
          <h2 class="chart-title">Utilisateurs / Mois</h2>
          <!-- Le ChartWrapper utilise Chart.js, pas Tailwind directement pour le rendu -->
          <ChartWrapper v-if="userChartData" type="bar" :data="userChartData" :options="chartOptions" />
          <div v-else class="no-chart-data">Données indisponibles</div>
        </div>
        <!-- Conteneur pour le graphique Activité -->
        <div class="chart-container">
          <h2 class="chart-title">Activité / Jour</h2>
           <ChartWrapper v-if="activityChartData" type="line" :data="activityChartData" :options="chartOptions" />
           <div v-else class="no-chart-data">Données indisponibles</div>
        </div>
      </div>
    </div>
  </div>
</template>
  

  <script setup>
import { ref, onMounted, reactive } from 'vue';
import StatCard from '@/components/admin/StatCard.vue';
import ChartWrapper from '@/components/admin/ChartWrapper.vue';
import { getAdminAuthToken } from '@/utils/adminAuth'; // Helper pour le token admin

const loading = ref(true);
const error = ref('');
// Initialiser les statistiques
const stats = ref({
    totalUsers: 0,
    totalVoiceNotes: 0,
    pendingReports: 0
});
const userChartData = ref(null); // Données pour le graphique Nouveaux Utilisateurs / Mois
const activityChartData = ref(null); // Données pour le graphique Activité / Jour

// Options Chart.js (adaptées pour thème sombre)
const chartOptions = reactive({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            ticks: { color: '#9ca3af', precision: 0 }, // Pas de décimales sur l'axe Y
            grid: { color: 'rgba(75, 85, 99, 0.5)' }
        },
        x: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75, 85, 99, 0.2)' }
        }
    },
    plugins: {
        legend: {
            position: 'top', // Position de la légende
            labels: { color: '#d1d5db' }
        },
        tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#ffffff',
            bodyColor: '#e5e7eb',
            borderColor: '#4b5563', // Bordure tooltip
            borderWidth: 1
        }
    }
});

// URL de base pour les API admin (adaptez si besoin)
const apiAdminBaseUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app/api'}/auth/admin`;

// Fonction principale pour charger toutes les données du dashboard
const fetchDashboardData = async () => {
    loading.value = true;
    error.value = '';
    const token = getAdminAuthToken();

    if (!token) {
        error.value = "Authentification Admin requise.";
        loading.value = false;
        return;
    }

    console.log(`[AdminDashboard] Fetching data...`);
    try {
        // Tableau des promesses pour les appels API
        const fetchPromises = [
            // 1. Statistiques Générales
            fetch(`${apiAdminBaseUrl}/stats`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            }),
            // 2. Utilisateurs par Mois
            fetch(`${apiAdminBaseUrl}/stats/users-over-time`, { // Pour le graphique Bar
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            }),
            // 3. Activité par Jour (Notes et Utilisateurs)
            fetch(`${apiAdminBaseUrl}/stats/activity-over-time?days=30`, { // Pour le graphique Line (30 derniers jours)
                 headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            })
        ];

        // Exécuter en parallèle
        const responses = await Promise.all(fetchPromises);

        // Vérifier si toutes les réponses sont OK
        for (const response of responses) {
            if (!response.ok) {
                let errorMsg = `Erreur ${response.status} sur ${response.url}`;
                 try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch(e){}
                throw new Error(errorMsg);
            }
        }

        // Parser les réponses JSON
        const [statsResult, usersChartResult, activityChartResult] = await Promise.all(
            responses.map(res => res.json())
        );

        // --- Traiter les Statistiques Générales ---
        console.log("[AdminDashboard] Stats API Response:", statsResult);
        if (statsResult.status === 'success' && statsResult.data) {
            stats.value = {
                totalUsers: statsResult.data.totalUsers ?? 0,
                totalVoiceNotes: statsResult.data.totalVoiceNotes ?? 0,
                pendingReports: statsResult.data.pendingReports ?? 0
            };
        } else {
             console.warn("Structure de réponse inattendue pour /stats:", statsResult);
             // Ne pas écraser l'erreur globale si une autre requête échoue aussi
             if (!error.value) error.value = "Format stats invalide.";
        }

        // --- Traiter le Graphique Utilisateurs par Mois ---
        console.log("[AdminDashboard] User Chart API Response:", usersChartResult);
         if (usersChartResult.status === 'success' && usersChartResult.data && Array.isArray(usersChartResult.data.labels) && Array.isArray(usersChartResult.data.values)) {
             userChartData.value = {
                 labels: usersChartResult.data.labels,
                 datasets: [{
                     label: 'Nouveaux Utilisateurs',
                     data: usersChartResult.data.values,
                     backgroundColor: 'rgba(99, 102, 241, 0.6)', // Indigo
                     borderColor: 'rgb(99, 102, 241)',
                     borderWidth: 1
                  }]
             };
         } else {
             console.warn("Structure de réponse inattendue pour /stats/users-over-time:", usersChartResult);
             userChartData.value = null;
             if (!error.value) error.value = "Format graphique utilisateurs invalide.";
         }

        // --- Traiter le Graphique Activité par Jour ---
        console.log("[AdminDashboard] Activity Chart API Response:", activityChartResult);
        // Vérifie la structure attendue (labels + tableau datasets avec label/values)
        if (activityChartResult.status === 'success' && activityChartResult.data && Array.isArray(activityChartResult.data.labels) && Array.isArray(activityChartResult.data.datasets) && activityChartResult.data.datasets.length >= 2) { // Au moins 2 datasets attendus
             activityChartData.value = {
                  labels: activityChartResult.data.labels, // Les jours (YYYY-MM-DD)
                  datasets: [
                     // Dataset 1: Utilisateurs Créés
                     {
                         label: activityChartResult.data.datasets[0]?.label || 'Utilisateurs Créés', // Prend le label de l'API ou défaut
                         data: activityChartResult.data.datasets[0]?.values || [], // Prend les valeurs ou tableau vide
                         borderColor: 'rgb(99, 102, 241)', // Bleu/Indigo pour utilisateurs
                         backgroundColor: 'rgba(99, 102, 241, 0.1)', // Optionnel
                         tension: 0.1,
                         fill: false
                     },
                      // Dataset 2: Notes Créées
                     {
                         label: activityChartResult.data.datasets[1]?.label || 'Notes Créées', // Prend le label de l'API ou défaut
                         data: activityChartResult.data.datasets[1]?.values || [], // Prend les valeurs ou tableau vide
                         borderColor: 'rgb(16, 185, 129)', // Vert/Émeraude pour notes
                         backgroundColor: 'rgba(16, 185, 129, 0.1)',
                         tension: 0.1,
                         fill: false
                     }
                  ]
              };
        } else {
             console.warn("Structure de réponse inattendue pour /stats/activity-over-time:", activityChartResult);
             activityChartData.value = null;
             if (!error.value) error.value = "Format graphique activité invalide.";
        }

    } catch (err) {
        console.error("Erreur globale chargement dashboard:", err);
        // Si error.value n'a pas déjà été défini par une erreur de format spécifique
        if (!error.value) {
             error.value = err.message || "Impossible de charger les données du tableau de bord.";
        }
        // Réinitialiser pour éviter d'afficher des données partielles
        stats.value = { totalUsers: 'Erreur', totalVoiceNotes: 'Erreur', pendingReports: 'Erreur' };
        userChartData.value = null;
        activityChartData.value = null;
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (getAdminAuthToken()) {
        fetchDashboardData();
    } else {
        error.value = "Accès Admin non autorisé.";
        loading.value = false;
        // Optionnel : Redirection vers login admin
        // import { useRouter } from 'vue-router';
        // const router = useRouter();
        // router.push({ name: 'AdminLogin' });
    }
});
</script>
  
<style scoped>
  .dashboard-page {
    /* Styles pour la page complète si besoin */
  }
  
  /* Titre de la page */
  .page-title {
    font-size: 1.875rem; /* text-3xl */
    line-height: 2.25rem;
    font-weight: 600; /* font-semibold */
    margin-bottom: 1.5rem; /* mb-6 */
    color: #ffffff; /* text-white */
  }
  
  /* Indicateur de chargement */
  .loading-indicator {
    text-align: center;
    padding: 2.5rem 0; /* py-10 */
    color: #9ca3af; /* text-gray-400 */
    font-style: italic;
    font-size: 1.1em;
  }
  /* Ajouter style pour l'icône spinner si vous en mettez une */
  .loading-indicator i { margin-right: 0.5rem; }
  
  /* Message d'erreur */
  .error-message {
    background-color: #450a0a; /* bg-red-900 approx */
    border: 1px solid #7f1d1d; /* border-red-700 approx */
    color: #fecaca; /* text-red-200 */
    padding: 0.75rem 1rem; /* px-4 py-3 */
    border-radius: 0.25rem; /* rounded */
    margin-bottom: 1.5rem; /* mb-6 */
    position: relative; /* Pour positionner des éléments internes si besoin */
  }
  .error-message strong { font-weight: 700; /* font-bold */ }
  .error-message span { display: block; } /* block */
  @media (min-width: 640px) { /* sm: */
    .error-message span { display: inline; } /* sm:inline */
  }
  
  /* Conteneur pour le contenu principal une fois chargé */
  .dashboard-content {
    /* Pas de style spécifique nécessaire ici, la mise en page est faite par les grilles */
  }
  
  /* Grille pour les cartes de statistiques */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr)); /* 1 colonne par défaut */
    gap: 1.5rem; /* gap-6 */
    margin-bottom: 2rem; /* mb-8 */
  }
  /* 2 colonnes sur écrans moyens */
  @media (min-width: 768px) { /* md: */
    .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  /* 3 colonnes sur grands écrans */
  @media (min-width: 1024px) { /* lg: */
    .stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  
  /* Grille pour les graphiques */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr)); /* 1 colonne par défaut */
    gap: 1.5rem; /* gap-6 */
  }
  /* 2 colonnes sur grands écrans */
  @media (min-width: 1024px) { /* lg: */
    .charts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  
  /* Conteneur pour chaque graphique */
  .chart-container {
    background-color: #1f2937; /* bg-gray-800 */
    padding: 1.5rem; /* p-6 */
    border-radius: 0.5rem; /* rounded-lg */
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); /* shadow-lg */
    min-height: 350px; /* Hauteur minimale pour voir le graphique */
    display: flex; /* Pour centrer le message si pas de données */
    flex-direction: column; /* Titre en haut, graphique en bas */
  }
  
  /* Titre à l'intérieur du conteneur de graphique */
  .chart-title {
    font-size: 1.25rem; /* text-xl */
    line-height: 1.75rem;
    font-weight: 600; /* font-semibold */
    margin-bottom: 1rem; /* mb-4 */
    color: #d1d5db; /* text-gray-300 */
    flex-shrink: 0; /* Empêche le titre de rétrécir */
  }
  
  /* Message si pas de données de graphique */
  .no-chart-data {
    text-align: center;
    color: #6b7280; /* text-gray-500 */
    padding: 2rem 0; /* py-8 approx */
    flex-grow: 1; /* Prend l'espace restant */
    display: flex;
    align-items: center;
    justify-content: center;
    font-style: italic;
  }
  
  /* Assurez-vous que le composant ChartWrapper a une hauteur définie ou utilise celle du parent */
  /* Le style dans ChartWrapper.vue est déjà correct pour ça */
  
  </style>