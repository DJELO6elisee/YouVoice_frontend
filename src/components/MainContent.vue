// src/components/VoiceNoteFeed.vue
<template>
  <div class="voice-note-feed">
    <div v-if="loading" class="loading-message">
        <i class="fa-solid fa-spinner fa-spin"></i> Chargement des notes...
    </div>
    <div v-else-if="errorLoading" class="error-message feed-error">
        <i class="fa-solid fa-circle-exclamation"></i> Erreur: {{ errorLoading }}
    </div>
    <div v-else-if="voiceNotes.length === 0" class="empty-feed">
        <p>Aucune note vocale à afficher pour le moment.</p>
    </div>
    <div v-else class="notes-list">
      <!-- Boucle sur les notes et affiche une carte pour chacune -->
      <NoteCard
        v-for="note in voiceNotes"
        :key="note.id"
        :note="note"
        :current-user-id="currentUserId"
        :backend-url="backendUrl"
        @update:note="updateNoteInList"
        @error="handleCardError"
        class="note-item"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NoteCard from './NoteCard.vue'; // Assure-toi que le chemin est correct

const props = defineProps({
    currentUserId: { // Reçoit l'ID de l'utilisateur connecté du parent
        type: [String, Number],
        required: true
    },
    backendUrl: { // Reçoit l'URL du backend du parent
        type: String,
        required: true
    }
});

const voiceNotes = ref([]); // Tableau pour stocker les notes récupérées
const loading = ref(true);
const errorLoading = ref('');

// Fonction pour récupérer les notes depuis l'API
const fetchVoiceNotes = async () => {
    loading.value = true;
    errorLoading.value = '';
    console.log(`[Feed] Fetching voice notes from ${props.backendUrl}/api/voice-notes`); // Note: /voicenotes et non /voice-notes pour GET list
    try {
        // *** ATTENTION: Adapte l'endpoint si nécessaire. GET /api/voicenotes est supposé ici ***
        const response = await fetch(`${props.backendUrl}/api/voice-notes`); // Endpoint pour la LISTE

        if (!response.ok) {
            let errorMsg = `Erreur ${response.status}`;
            try { const errData = await response.json(); errorMsg = errData.message || response.statusText; }
            catch (e) { errorMsg = response.statusText; }
            throw new Error(errorMsg);
        }
        const data = await response.json();

        // Adapte ceci à la structure EXACTE de ta réponse API pour la liste
        if (data && data.status === 'success' && data.data && Array.isArray(data.data.voiceNotes)) {
            voiceNotes.value = data.data.voiceNotes;
             console.log(`[Feed] Successfully fetched ${voiceNotes.value.length} notes.`);
        } else {
            console.error("[Feed] Invalid API response structure:", data);
            throw new Error("Format de réponse de l'API invalide.");
        }
    } catch (err) {
        console.error("[Feed] Error fetching notes:", err);
        errorLoading.value = err.message || "Impossible de charger les notes.";
    } finally {
        loading.value = false;
    }
};

// Fonction pour mettre à jour une note spécifique dans la liste (appelée par l'événement @update:note)
const updateNoteInList = (updatedNoteData) => {
    console.log(`[Feed] Received update for note ID: ${updatedNoteData.id}`);
    const index = voiceNotes.value.findIndex(n => n.id === updatedNoteData.id);
    if (index !== -1) {
        // Remplace l'objet note existant par le nouveau pour déclencher la réactivité
        voiceNotes.value.splice(index, 1, updatedNoteData);
        console.log("[Feed] Note updated in local list.");
    } else {
        console.warn(`[Feed] Note with ID ${updatedNoteData.id} not found in list for update.`);
    }
};

// Gestionnaire d'erreur potentiel provenant des cartes
const handleCardError = (errorMessage) => {
    console.error("[Feed] Error received from VoiceNoteCard:", errorMessage);
    // Afficher une notification globale ? Pour l'instant, on logge juste.
    // errorLoading.value = errorMessage; // Pourrait écraser l'erreur de chargement initiale
};


// Récupérer les notes quand le composant est monté
onMounted(() => {
    // Vérifier si l'utilisateur est connecté avant de fetch
    if (props.currentUserId) {
        fetchVoiceNotes();
    } else {
        errorLoading.value = "Utilisateur non identifié.";
        loading.value = false;
         console.warn("[Feed] Cannot fetch notes, currentUserId is missing.");
    }
});

</script>

<style scoped>
.voice-note-feed {
  width: 100%;
  max-width: 900px; /* Limite la largeur du feed */
  margin: 0 auto; /* Centre le feed */
  padding: 0 10px; /* Un peu d'espace sur les côtés */

}


.loading-message, .error-message, .empty-feed {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}
.error-message i {
    color: #dc3545;
    margin-right: 8px;
}
.loading-message i {
    margin-right: 8px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Espace entre les cartes */
}


</style>
