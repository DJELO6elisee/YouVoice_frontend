<template>
    <!-- Ajout d'un @click pour pouvoir émettre un événement si besoin, bien que le parent écoute déjà -->
    <button class="fab" title="Enregistrer une note vocale">
        <i class="fa-solid fa-microphone"></i>
    </button>
</template>

<script setup>
// Pas besoin de script ici si le parent gère le clic via @click sur le composant
// Si ce bouton devait avoir sa propre logique, on l'ajouterait ici.
</script>

<style scoped>
.fab {
    position: fixed; /* Fixé par rapport à la fenêtre */
    /* Positionnement en bas à droite */
    bottom: 20px;     /* Espace par rapport au bas */
    right: 42%;      /* Espace par rapport à la droite */
    /* Apparence */
    width: 56px;      /* Taille standard pour FAB */
    height: 56px;
    border-radius: 50%; /* Rond */
    background-color: #f5a623; /* Votre couleur orange/jaune */
    color: white;     /* Icône blanche */
    border: none;
    font-size: 24px;  /* Taille de l'icône ajustée */
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); /* Ombre standard */
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.1s ease-out; /* Transitions */
    z-index: 950;     /* << AJOUT: Au-dessus du contenu, mais sous la sidebar/overlay (si > 1000) */
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent; /* Enlève le flash bleu au clic sur mobile */
}

.fab:hover {
    background-color: #e0901d; /* Couleur plus foncée au survol */
}

.fab:active {
    /* Effet léger au clic */
    transform: scale(0.95);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Optionnel: Ajustements pour écrans plus larges si nécessaire */
/* Souvent, le positionnement fixed bottom/right fonctionne bien sur toutes les tailles */

@media (max-width: 834px) {
    .fab {
        width: 60px;
        height: 60px;
        bottom: 110px;
        font-size: 26px;
    }
}

@media (max-width: 768px) {
    .fab {
        width: 60px;
        height: 60px;
        bottom: 80px;
        font-size: 26px;
    }
}

</style>