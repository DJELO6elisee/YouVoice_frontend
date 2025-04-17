<template>
    <!-- Liaison de la classe du thème au conteneur principal -->
    <div class="dashboard-container" :class="theme">
        <!-- NOUVEAU: En-tête pour le titre et le bouton de thème -->
        <div class="dashboard-header">
            <h2>Tableau de Bord Utilisateur</h2>
            <!-- NOUVEAU: Bouton de bascule de thème -->
            <router-link to="/dashboard" class="nav-item">
                <i class="fa-sharp fa-solid fa-house"></i>
            </router-link>
            <button @click="toggleTheme" class="theme-toggle-btn" :aria-label="'Passer en mode ' + (theme === 'light' ? 'sombre' : 'clair')">
                <span v-if="theme === 'light'">🌙</span> <!-- Icône pour passer en sombre -->
                <span v-else>☀️</span>             <!-- Icône pour passer en clair -->
            </button>
        </div>

        <!-- État de Chargement -->
        <div v-if="loading" class="loading-indicator">
            <p>Chargement des données du tableau de bord...</p>
            <!-- Optionnel: Ajoute un spinner ici -->
        </div>

        <!-- État d'Erreur -->
        <div v-else-if="error" class="error-message">
            <p>Erreur lors du chargement des données : {{ error }}</p>
            <button @click="fetchDashboardData">Réessayer</button>
        </div>

        <!-- Contenu du Dashboard -->
        <div v-else class="dashboard-content">
            <!-- Section des Statistiques Clés -->
            <section class="stats-grid">
                <div v-for="stat in stats" :key="stat.label" class="stat-card">
                    <div class="stat-icon">
                        <i :class="['custom-icon', 'icon-' + stat.icon]" aria-hidden="true"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-value">{{ formatNumber(stat.value) }}</span>
                        <span class="stat-label">{{ stat.label }}</span>
                    </div>
                </div>
            </section>

            <!-- Section du Graphique d'Activité -->
            <section class="chart-container">
                <h3>Activité Récente</h3>
                <div class="chart-wrapper">
                    <!-- S'assure que les données sont prêtes avant de rendre le graphique -->
                    <Line v-if="chartData.labels?.length && !loading" :data="chartData" :options="chartOptions" />
                    <p v-else-if="!loading" class="no-chart-data">Données insuffisantes pour afficher le graphique.</p>
                    <!-- Ajout d'un placeholder pendant le chargement pour éviter le flash -->
                    <p v-else class="loading-chart-placeholder">Chargement du graphique...</p>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
const router = useRouter();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app'; // Fallback pour dev

// Enregistrement Chart.js (inchangé)
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// --- État Réactif ---
const loading = ref(true);
const error = ref(null);
const userData = ref({
    likes: 0, comments: 0, shares: 0, activity: [],
});
// Thème initialisé par loadTheme
const theme = ref('light');

// --- Données et Options du Graphique ---
const chartData = reactive({
    labels: [],
    datasets: [{
        label: 'Actions Utilisateur',
        // Les couleurs seront mises à jour dynamiquement
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointRadius: 4, pointHoverRadius: 6, tension: 0.1, data: [],
    }],
});

const chartOptions = reactive({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            // Les couleurs seront mises à jour dynamiquement
            ticks: { color: '#666' },
            grid: { color: '#e0e0e0', drawBorder: false },
        },
        x: {
            // Les couleurs seront mises à jour dynamiquement
            ticks: { color: '#666' },
            grid: { display: false }
        }
    },
    plugins: {
        legend: {
            display: true, position: 'top',
            // Les couleurs seront mises à jour dynamiquement
            labels: { color: '#333' }
        },
        tooltip: { /* ... options tooltip ... */ }
    },
});

// --- Computed pour structurer les stats (inchangé) ---
const stats = computed(() => [
    { label: 'Likes Reçus', value: userData.value.likes, icon: 'thumbs-up' },
    { label: 'Commentaires Reçus', value: userData.value.comments, icon: 'comments' },
    { label: 'Partages Générés', value: userData.value.shares, icon: 'share-nodes' },
]);


const getAuthHeaders = () => {
    const headers = {
        'Accept': 'application/json',
        // 'Content-Type': 'application/json', // Pas nécessaire pour GET
    };
    const token = localStorage.getItem('authToken'); // Ou l'endroit où tu stockes le token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn("Auth token not found for API request.");
        // Gérer l'absence de token si nécessaire (redirection login ?)
    }
    return headers;
};

// --- Fonctions (formatNumber, generateFakeActivity - inchangées) ---
const formatNumber = (num) => { /* ... */ if(num == null) return '0'; if(num >= 1000000) return (num/1000000).toFixed(1).replace(/\.0$/, '') + 'M'; if(num >= 1000) return (num/1000).toFixed(1).replace(/\.0$/, '') + 'k'; return num.toString(); };
// const generateFakeActivity = (numPoints) => { /* ... */ const labels = [];const data = [];const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];const today = new Date();for (let i = numPoints - 1; i >= 0; i--) {const date = new Date(today.getFullYear(), today.getMonth() - i, 1);labels.push(monthNames[date.getMonth()]);data.push({label: monthNames[date.getMonth()], actions: Math.floor(Math.random() * 100) + 10});}return data; }; // Placeholder


// --- NOUVEAU: Gestion du Thème ---
const loadTheme = () => {
    const savedTheme = localStorage.getItem('dashboardTheme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        theme.value = savedTheme;
    } else {
        // Optionnel: Détection préférence système
        // const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // theme.value = prefersDark ? 'dark' : 'light';
        theme.value = 'light'; // Ou garder 'light' par défaut
    }
    console.log("Theme loaded:", theme.value);
    // Appliquer la classe au body si le style est global (optionnel)
    // document.body.className = theme.value;
};

const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('dashboardTheme', theme.value);
    console.log("Theme toggled to:", theme.value);
    // Appliquer la classe au body si le style est global (optionnel)
    // document.body.className = theme.value;
};

// --- NOUVEAU: Mettre à jour les couleurs du graphique en fonction du thème ---
const updateChartColors = (newTheme) => {
    const isDark = newTheme === 'dark';

    // Définir les couleurs en fonction du thème
    const gridColor = isDark ? '#444' : '#e0e0e0';
    const ticksColor = isDark ? '#ccc' : '#666';
    const legendColor = isDark ? '#eee' : '#333';
    const lineBorderColor = isDark ? 'rgb(100, 181, 246)' : 'rgb(54, 162, 235)';
    const lineBgColor = isDark ? 'rgba(100, 181, 246, 0.2)' : 'rgba(54, 162, 235, 0.2)';
    const pointBgColor = isDark ? 'rgb(100, 181, 246)' : 'rgb(54, 162, 235)';

    // Mettre à jour les options du graphique
    if (chartOptions.scales?.y?.ticks) chartOptions.scales.y.ticks.color = ticksColor;
    if (chartOptions.scales?.y?.grid) chartOptions.scales.y.grid.color = gridColor;
    if (chartOptions.scales?.x?.ticks) chartOptions.scales.x.ticks.color = ticksColor;
    if (chartOptions.plugins?.legend?.labels) chartOptions.plugins.legend.labels.color = legendColor;

    // Mettre à jour les données du dataset
    if (chartData.datasets[0]) {
        chartData.datasets[0].borderColor = lineBorderColor;
        chartData.datasets[0].backgroundColor = lineBgColor;
        chartData.datasets[0].pointBackgroundColor = pointBgColor;
    }

    // NOTE: Chart.js devrait détecter les changements dans les objets réactifs chartData/chartOptions.
    // Si le graphique ne se met pas à jour visuellement, envisagez d'ajouter une clé `:key` au composant <Line>
    // qui change avec le thème, pour forcer une re-création complète. Ex: :key="theme"
    console.log("Chart colors updated for theme:", newTheme);
};

// --- NOUVEAU: Watcher pour réagir aux changements de thème ---
watch(theme, (newTheme, oldTheme) => {
    if (newTheme !== oldTheme) {
        updateChartColors(newTheme);
    }
});

const fetchDashboardData = async () => {
    loading.value = true;
    error.value = null;
    console.log("Fetching dashboard data from API...");

    try {
        const response = await fetch(`${API_BASE_URL}/auth/dashboard`, { 
            method: 'GET',
            headers: getAuthHeaders(), // Ajoute le token
        });

        // Gérer les erreurs HTTP qui ne lèvent pas d'exception (4xx, 5xx)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText })); // Essayer de parser l'erreur
            const errorMessage = `Erreur API (${response.status}): ${errorData.message || 'Erreur inconnue'}`;
            throw new Error(errorMessage);
        }

        // Parser la réponse si OK
        const apiResponse = await response.json();

        // Vérifier le format de la réponse attendue
        if (apiResponse.status !== 'success' || !apiResponse.data) {
            throw new Error('Format de réponse API invalide.');
        }

        // Mettre à jour l'état Vue avec les données réelles
        userData.value = {
            ...userData.value, // Garder d'autres éventuelles données utilisateur
            ...(apiResponse.data.stats || { likes: 0, comments: 0, shares: 0 }), // Utiliser les stats reçues ou des valeurs par défaut
            activity: apiResponse.data.activity || [], // Utiliser les données d'activité reçues
        };

        // Mettre à jour les données du graphique
        chartData.labels = userData.value.activity.map(item => item.label || '?'); // Utiliser les labels reçus
        chartData.datasets[0].data = userData.value.activity.map(item => item.actions || 0); // Utiliser les actions reçues

        // Appliquer les couleurs du thème
        updateChartColors(theme.value);

        console.log("Dashboard data loaded from API:", userData.value);

    } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        error.value = err.message || 'Impossible de récupérer les données du tableau de bord.';
        // Réinitialiser les données en cas d'erreur
        userData.value = { likes: 0, comments: 0, shares: 0, activity: [] };
        chartData.labels = [];
        chartData.datasets[0].data = [];
    } finally {
        loading.value = false;
    }
};


// --- Cycle de vie ---
onMounted(() => {
    loadTheme(); // Charger le thème en premier
    fetchDashboardData(); // Puis les données (qui appliqueront les bonnes couleurs)
});

</script>

<style scoped>
/* --- Variables CSS pour Thèmes --- */
:root { /* Défaut = Clair */
    --dashboard-bg: #f8f9fa;
    --card-bg: #ffffff;
    --text-primary: #212529;
    --text-secondary: #6c757d;
    --accent-color: #007bff;
    --border-color: #dee2e6;
    --shadow-color: rgba(0, 0, 0, 0.08);
    --icon-color: var(--accent-color);
    --loading-text: var(--text-secondary);
    --error-text: #dc3545;
    --error-bg: #f8d7da;
    --error-border: #f5c6cb;
    --button-bg: #e9ecef;
    --button-text: var(--text-primary);
    --button-hover-bg: #ced4da;
}

/* Classe appliquée au conteneur quand le thème est 'dark' */
.dashboard-container.dark {
    --dashboard-bg: #1a1d24;
    --card-bg: #252a33;
    --text-primary: #e4e6eb;
    --text-secondary: #b0b3b8;
    --accent-color: #4dabf7;
    --border-color: #3b4351;
    --shadow-color: rgba(0, 0, 0, 0.2);
    --icon-color: var(--accent-color);
    --loading-text: var(--text-secondary);
    --error-text: #f17c8a;
    --error-bg: #492f33;
    --error-border: #6e464b;
    --button-bg: #3b4351;
    --button-text: var(--text-primary);
    --button-hover-bg: #4a5260;
}

/* --- Styles Généraux --- */
.dashboard-container {
    padding: 25px;
    background-color: var(--dashboard-bg);
    color: var(--text-primary);
    border-radius: 8px;
    transition: background-color 0.3s, color 0.3s;
    min-height: 100vh;
}

/* NOUVEAU: Header */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    flex-wrap: wrap;
    gap: 15px;
}

.dashboard-container h2 {
    margin-top: 0;
    margin-bottom: 0; /* Géré par le gap du header */
    color: var(--text-primary);
    font-weight: 600;
}

/* NOUVEAU: Bouton Thème */
.theme-toggle-btn {
    background-color: var(--button-bg);
    color: var(--button-text);
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    border-radius: 50px;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    transition: background-color 0.2s, border-color 0.2s, transform 0.1s ease-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
    flex-shrink: 0; /* Empêche le bouton de rétrécir */
}
.theme-toggle-btn:hover {
    background-color: var(--button-hover-bg);
}
.theme-toggle-btn:active {
    transform: scale(0.95);
}

/* --- Indicateurs Chargement/Erreur --- */
.loading-indicator,
.error-message {
    padding: 20px;
    text-align: center;
    border-radius: 5px;
    margin-bottom: 20px;
}
.loading-indicator p {
    color: var(--loading-text);
    font-style: italic;
}
.error-message {
    background-color: var(--error-bg);
    border: 1px solid var(--error-border);
    color: var(--error-text);
}
.error-message button {
    margin-top: 10px;
    padding: 8px 15px;
    background-color: var(--error-text);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.2s;
}
.error-message button:hover {
    opacity: 0.85;
}

/* --- Grille des Stats --- */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}
.stat-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 2px 10px var(--shadow-color);
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.3s, border-color 0.3s;
    border: 1px solid var(--border-color);
}
.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px var(--shadow-color);
}
.stat-icon {
    width: 50px;
    height: 50px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.stat-info {
    display: flex;
    flex-direction: column;
}
.stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
    transition: color 0.3s;
}
.stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 2px;
    transition: color 0.3s;
}

/* --- Icônes personnalisées (avec mask-image) --- */
.custom-icon {
    display: inline-block;
    width: 32px;
    height: 32px;
    background-color: var(--icon-color); /* Couleur de l'icône définie par variable */
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
    transition: background-color 0.3s; /* Transition pour la couleur */
}

/* Assurez-vous que les chemins sont corrects */
/* .icon-thumbs-up { mask-image: url('@/assets/icons/like.svg'); -webkit-mask-image: url('@/assets/icons/like.svg'); }
.icon-comments { mask-image: url('@/assets/icons/comment.svg'); -webkit-mask-image: url('@/assets/icons/comment.svg'); }
.icon-share-nodes { mask-image: url('@/assets/icons/share.svg'); -webkit-mask-image: url('@/assets/icons/share.svg'); } */


/* --- Conteneur du Graphique --- */
.chart-container {
    background-color: var(--card-bg);
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--shadow-color);
    border: 1px solid var(--border-color);
    transition: background-color 0.3s, border-color 0.3s;
}
.chart-container h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-weight: 600;
    color: var(--text-primary);
    transition: color 0.3s;
}
.chart-wrapper {
    position: relative;
    height: 350px;
}
.no-chart-data,
.loading-chart-placeholder {
    text-align: center;
    color: var(--text-secondary);
    padding: 50px 0;
    font-style: italic;
    transition: color 0.3s;
}

/* --- Responsivité --- */
@media (max-width: 768px) {
    .dashboard-container { padding: 15px; }
    .stats-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
    .stat-card { padding: 15px; gap: 10px; }
    .stat-icon { width: 40px; height: 40px; }
    .custom-icon { width: 24px; height: 24px; }
    .stat-value { font-size: 1.5rem; }
    .stat-label { font-size: 0.8rem; }
    .chart-wrapper { height: 300px; }
    .dashboard-header { margin-bottom: 20px; } /* Réduire marge header */
}
@media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr; } /* Une seule colonne */
}

</style>