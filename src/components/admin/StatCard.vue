<template>
  <!-- Classe racine pour le style général -->
  <div class="stat-card">
    <!-- Wrapper pour l'icône, avec classe de couleur dynamique -->
    <div class="icon-wrapper" :class="iconBgColorClass">
      <!-- Icône FontAwesome, avec classe de couleur dynamique -->
      <i :class="[icon, iconColorClass]"></i>
    </div>
    <!-- Conteneur pour le texte -->
    <div class="text-content">
      <!-- Titre de la carte -->
      <p class="title">{{ title }}</p>
      <!-- Valeur de la carte -->
      <p class="value">{{ formattedValue }}</p>
    </div>
  </div>
</template>
  
<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: String, default: 'fas fa-info-circle' },
  // La prop 'colorClass' reçoit maintenant un nom simple comme 'blue', 'green', 'yellow', 'warning', etc.
  // ou reste une classe text-color si c'est plus simple pour vous de la passer depuis le parent.
  // Ici, on suppose qu'on passe juste 'blue', 'green', 'yellow', etc.
  colorName: { type: String, default: 'blue' }
});

// Formatter les grands nombres (inchangé)
const formattedValue = computed(() => {
  if (typeof props.value === 'number' && props.value >= 1000) {
    return (props.value / 1000).toFixed(1) + 'k';
  }
   // Gérer le cas 'N/A' ou 'Erreur'
  if (typeof props.value !== 'number') {
      return props.value;
  }
  return props.value;
});

// Retourne une classe CSS pour le fond de l'icône
const iconBgColorClass = computed(() => {
  switch (props.colorName) {
    case 'blue': return 'icon-bg-blue';
    case 'green': return 'icon-bg-green';
    case 'yellow': // ou 'warning' si vous préférez
    case 'warning': return 'icon-bg-yellow';
    case 'red': return 'icon-bg-red';
    default: return 'icon-bg-gray'; // Classe par défaut
  }
});

// Retourne une classe CSS pour la couleur de l'icône
const iconColorClass = computed(() => {
   switch (props.colorName) {
    case 'blue': return 'icon-color-blue';
    case 'green': return 'icon-color-green';
    case 'yellow':
    case 'warning': return 'icon-color-yellow';
    case 'red': return 'icon-color-red';
    default: return 'icon-color-gray'; // Classe par défaut
  }
});

</script>
<style scoped>
/* Conteneur principal de la carte */
.stat-card {
  background-color: #1f2937; /* Correspond à bg-gray-800 */
  padding: 1.5rem; /* Correspond à p-6 */
  border-radius: 0.5rem; /* Correspond à rounded-lg */
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); /* Correspond à shadow-lg */
  display: flex;
  align-items: center;
  gap: 1rem; /* Correspond à space-x-4 */
}

/* Wrapper autour de l'icône */
.icon-wrapper {
  padding: 0.75rem; /* Correspond à p-3 */
  border-radius: 9999px; /* Correspond à rounded-full */
  flex-shrink: 0; /* Empêche de rétrécir */
  display: inline-flex; /* Pour centrer l'icône si besoin */
  align-items: center;
  justify-content: center;
}

/* Styles de l'icône elle-même */
.icon-wrapper i {
  font-size: 1.25rem; /* Correspond à text-xl */
  line-height: 1; /* Assure centrage vertical */
}

/* Classes de couleur pour le FOND de l'icône */
.icon-bg-blue { background-color: #1e3a8a; /* bg-blue-900 */ }
.icon-bg-green { background-color: #065f46; /* bg-green-900 */ }
.icon-bg-yellow { background-color: #92400e; /* bg-yellow-900 */ }
.icon-bg-red { background-color: #991b1b; /* bg-red-900 */ }
.icon-bg-gray { background-color: #374151; /* bg-gray-700 */ }

/* Classes de couleur pour l'icône elle-même */
.icon-color-blue { color: #60a5fa; /* text-blue-400 */ }
.icon-color-green { color: #34d399; /* text-green-400 */ }
.icon-color-yellow { color: #facc15; /* text-yellow-400 */ }
.icon-color-red { color: #f87171; /* text-red-400 */ }
.icon-color-gray { color: #9ca3af; /* text-gray-400 */ }


/* Conteneur pour le texte */
.text-content {
  /* Pas besoin de style spécifique, flex gère l'espace */
}

/* Style du titre */
.title {
  font-size: 0.875rem; /* Correspond à text-sm */
  line-height: 1.25rem;
  font-weight: 500; /* Correspond à font-medium */
  color: #9ca3af; /* Correspond à text-gray-400 */
  text-transform: uppercase;
  margin: 0; /* Reset marge paragraphe */
}

/* Style de la valeur */
.value {
  font-size: 1.875rem; /* Correspond à text-3xl */
  line-height: 2.25rem;
  font-weight: 600; /* Correspond à font-semibold */
  color: #ffffff; /* Correspond à text-white */
  margin: 0; /* Reset marge paragraphe */
  margin-top: 0.25rem; /* Petit espace entre titre et valeur */
}
</style>