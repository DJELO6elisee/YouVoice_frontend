<script setup>
// Importer uniquement ce qui est nécessaire de vue-router pour ce composant racine
import { RouterView } from 'vue-router'; 

// Pas besoin d'importer d'autres composants ici pour l'instant
</script>

<template>
  <!-- La balise principale <main> est une bonne pratique sémantique -->
  <main>
    <!-- RouterView est l'endroit où les composants correspondants -->
    <!-- aux routes définies dans src/router/index.js seront rendus. -->
    <!-- Quand vous naviguez vers /register, RegisterView s'affichera ici. -->
    <!-- Quand vous naviguez vers /login, LoginView s'affichera ici. -->
    <RouterView />
  </main>
</template>

<style>
/* Styles Globaux - Vous pouvez les mettre ici ou dans un fichier CSS séparé comme src/assets/main.css */

/* Réinitialisation simple (optionnel, mais souvent utile) */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0; 
  /* position: relative; */ /* Parfois utile, à ajouter si besoin */
  /* font-weight: normal; */ /* Dépend de vos préférences */
}

body {
  min-height: 100vh;
  /* transition: color 0.5s, background-color 0.5s; */ /* Transitions douces */
  line-height: 1.6;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8f9fa; /* Un fond léger pour le body */
  color: #212529; /* Couleur de texte par défaut */
}

/* Styles pour le conteneur principal si nécessaire */
#app {
  /* max-width: 1280px; */ /* Vous pouvez définir une largeur max */
  /* margin: 0 auto; */   /* Pour centrer si max-width est défini */
  /* padding: 2rem; */  /* Espace autour */
  /* font-weight: normal; */
}

/* Vous pouvez supprimer les styles spécifiques au header/logo de l'ancien App.vue */
/* dans les fichiers src/assets/base.css et src/assets/main.css s'ils existent */
/* ou adapter main.css pour vos styles globaux */

</style>