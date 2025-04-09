<template>
    <div class="chart-wrapper">
      <Bar v-if="type === 'bar'" :data="data" :options="options" />
      <Line v-else-if="type === 'line'" :data="data" :options="options" />
      <!-- Ajouter Doughnut, Pie, etc. si nécessaire -->
       <p v-else>Type de graphique non supporté: {{ type }}</p>
    </div>
  </template>
  
  <script setup>
  import { Bar, Line } from 'vue-chartjs';
  import {
    Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement
  } from 'chart.js';
  
  // Enregistrer les composants et plugins nécessaires de Chart.js
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement);
  
  const props = defineProps({
    type: { type: String, required: true, validator: (value) => ['bar', 'line'].includes(value) }, // Valide les types supportés
    data: { type: Object, required: true },
    options: { type: Object, default: () => ({ responsive: true, maintainAspectRatio: false }) }
  });
  </script>
  
  <style scoped>
  .chart-wrapper {
    height: 300px; /* Hauteur par défaut, peut être ajustée */
    position: relative;
  }
  </style>