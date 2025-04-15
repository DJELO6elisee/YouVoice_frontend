// src/components/VoiceNoteFeed.vue
// src/components/VoiceNoteFeed.vue ou MainContent.vue
<template>
  <div class="voice-note-feed">
    <!-- Indicateur de chargement -->
    <div v-if="loading" class="loading-message">
      <i class="fa-solid fa-spinner fa-spin"></i> Chargement des notes...
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="errorLoading" class="error-message feed-error">
      <i class="fa-solid fa-circle-exclamation"></i> Erreur: {{ errorLoading }}
    </div>

    <!-- Message si aucune note trouvée (prend en compte la recherche) -->
    <div v-else-if="voiceNotes.length === 0" class="empty-feed">
       <!-- Message spécifique si une recherche a été effectuée mais n'a rien donné -->
      <p v-if="props.searchTerm">
        Aucune note vocale trouvée correspondant à votre recherche "{{ props.searchTerm }}".
      </p>
      <!-- Message par défaut si aucune note n'existe et pas de recherche -->
      <p v-else>
        Il n'y a aucune note vocale à afficher pour le moment. Soyez le premier à en partager une !
      </p>
    </div>

    <!-- Liste des notes -->
    <div v-else class="notes-list">
      <NoteCard
        v-for="note in voiceNotes"
        :key="note.id"
        :note="note"
        :current-user-id="props.currentUserId"
        :backend-url="props.backendUrl"
        @update:note="updateNoteInList"
        @delete:note="removeNoteFromList"
        @error="handleCardError"
        class="note-item"
      />
    </div>

    <!-- Pagination (Exemple de base, à développer si nécessaire) -->
    <div v-if="!loading && totalPages > 1" class="pagination-controls">
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1">Précédent</button>
        <span>Page {{ currentPage }} sur {{ totalPages }}</span>
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages">Suivant</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, watch } from 'vue';
import NoteCard from './NoteCard.vue'; // Assure-toi que le chemin est correct

const props = defineProps({
    currentUserId: {
        type: [String, Number],
        // Peut être null si l'utilisateur n'est pas connecté
        required: false,
        default: null
    },
    backendUrl: {
        type: String,
        required: true
    },
    // La prop searchTerm est bien reçue
    searchTerm: {
        type: String,
        required: false, // Ou true selon votre logique parent
        default: ''
    }
});

const voiceNotes = ref([]);
const loading = ref(true);
const errorLoading = ref('');
const currentPage = ref(1); // État pour la page actuelle
const totalPages = ref(1); // État pour le nombre total de pages
const limitPerPage = 10; // Nombre de notes par page

let debounceTimer = null; // Pour le debounce de la recherche

// --- MODIFIÉ: Fonction pour récupérer les notes depuis l'API ---
const fetchVoiceNotes = async (page = 1, search = props.searchTerm) => {
    // Ne rien faire si l'ID utilisateur est manquant
    if (!props.currentUserId) {
        errorLoading.value = "Veuillez vous connecter pour voir les notes.";
        loading.value = false;
        voiceNotes.value = []; // Vider la liste
        totalPages.value = 1;
        currentPage.value = 1;
        console.warn("[Feed] Fetch annulé: currentUserId est manquant.");
        return;
    }

    loading.value = true;
    errorLoading.value = ''; // Réinitialiser l'erreur

    // Construire l'URL avec les paramètres de pagination et de recherche
    let apiUrl = `${props.backendUrl}/api/voice-notes?page=${page}&limit=${limitPerPage}`;
    if (search && search.trim() !== '') {
        apiUrl += `&search=${encodeURIComponent(search.trim())}`;
    }
    // Vous pouvez ajouter &sortBy=... &order=... ici si nécessaire

    console.log(`[Feed] Fetching voice notes from: ${apiUrl}`);

    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token d'authentification manquant.");

        const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });

        if (!response.ok) {
            let errorMsg = `Erreur ${response.status}`;
            try { const errData = await response.json(); errorMsg = errData.message || `Erreur serveur (${response.status})`; }
            catch (e) { errorMsg = `Erreur serveur (${response.status})`; }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        // Vérifier la structure de la réponse (adaptée à ce que votre API retourne)
        if (data && data.status === 'success' && data.data && Array.isArray(data.data.voiceNotes)) {
            voiceNotes.value = data.data.voiceNotes; // Remplace toujours les notes de la page actuelle
            currentPage.value = data.currentPage || 1;
            totalPages.value = data.totalPages || 1;
             console.log(`[Feed] Successfully fetched page ${currentPage.value}/${totalPages.value}. Notes count: ${voiceNotes.value.length}`);
        } else {
            console.error("[Feed] Invalid API response structure:", data);
            throw new Error("Format de réponse de l'API invalide.");
        }

    } catch (err) {
        console.error("[Feed] Error fetching notes:", err);
        errorLoading.value = err.message || "Impossible de charger les notes.";
        voiceNotes.value = []; // Vider en cas d'erreur
        currentPage.value = 1;
        totalPages.value = 1;
    } finally {
        loading.value = false;
    }
};

// --- Fonction pour changer de page ---
const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value && pageNumber !== currentPage.value) {
        fetchVoiceNotes(pageNumber, props.searchTerm); // Recharge les notes pour la nouvelle page avec le terme de recherche actuel
    }
};

// --- Fonctions de mise à jour locale ---
const updateNoteInList = (updatedNoteData) => {
    const index = voiceNotes.value.findIndex(n => n.id === updatedNoteData.id);
    if (index !== -1) {
        voiceNotes.value.splice(index, 1, updatedNoteData);
        console.log(`[Feed] Note ${updatedNoteData.id} updated locally.`);
    }
};

// <<< AJOUT: Fonction pour supprimer une note de la liste locale >>>
const removeNoteFromList = (noteId) => {
    const initialLength = voiceNotes.value.length;
    voiceNotes.value = voiceNotes.value.filter(n => n.id !== noteId);
    console.log(`[Feed] Note ${noteId} removed locally.`);
    // Optionnel : Si la page devient vide après suppression (et ce n'est pas la page 1),
    // on pourrait vouloir revenir à la page précédente ou recharger.
    // Pour l'instant, on laisse la page vide si c'est le cas.
    // if (voiceNotes.value.length === 0 && initialLength > 0 && currentPage.value > 1) {
    //    goToPage(currentPage.value - 1);
    // }
};

// Gestionnaire d'erreur des cartes
const handleCardError = (errorMessage) => {
    console.error("[Feed] Error from NoteCard:", errorMessage);
    // Afficher une notification?
};

// --- Watcher pour le terme de recherche ---
watch(() => props.searchTerm, (newSearchTerm) => {
    console.log(`[Feed] Search term changed: "${newSearchTerm}"`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        // Relancer la recherche depuis la page 1
        fetchVoiceNotes(1, newSearchTerm);
    }, 350); // Délai de debounce
});

// --- Chargement initial ---
onMounted(() => {
    // Appelle fetchVoiceNotes avec les valeurs par défaut (page 1, searchTerm initial)
    // La vérification du currentUserId se fait DANS fetchVoiceNotes
    fetchVoiceNotes();
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
