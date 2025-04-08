<template>
  <div class="user-profile-page">
      <!-- Indicateur de chargement -->
      <div v-if="isLoading" class="loading-indicator">Chargement du profil...</div>

      <!-- Affichage de l'erreur -->
      <!-- MODIFICATION: Condition pour ne pas afficher l'erreur si chargement -->
      <div v-if="!isLoading && error" class="error-message">{{ error }}</div>

      <!-- Contenu du profil (affiché seulement si pas d'erreur et chargement terminé) -->
        <template v-if="!isLoading && !error && userProfile">
          <!-- Profile Section -->
          <main class="profile-main">
              <div class="profile-banner">
                  <span class="profile-tag">MON PROFIL</span>
              </div>
              <div class="profile-details">
                  <div class="profile-picture-container">
                      <!-- Image dynamique : Utilise l'avatar de l'utilisateur ou une image par défaut -->
                      <img
                          :src="userProfile.avatar || 'https://via.placeholder.com/120'"
                          :alt="`${userProfile.username || 'Utilisateur'} Profile`"
                          class="profile-picture"
                      />
                      <button class="edit-profile-button" @click="goToEditProfile">Edit Profile</button>
                  </div>
                  <!-- Nom d'utilisateur dynamique -->
                  <h2 class="user-name">{{ userProfile.fullName || 'Nom inconnu' }}</h2>
                  <!-- Bio dynamique -->
                  <p class="user-bio">{{ userProfile.bio || 'Aucune bio disponible.' }}</p>
              </div>

              <!-- Audio Recorder/Player (Logique à implémenter séparément) -->
              <div class="audio-recorder">
                  <div class="mic-button-wrapper">
                      <button class="mic-button"><i class="fa-solid fa-microphone"></i></button>
                  </div>
                  <div class="timestamp">00:00:00</div> <!-- Logique d'enregistrement à ajouter -->
                  <div class="recorder-controls">
                      <button class="control-button trash-button"><i class="fa-solid fa-trash"></i></button>
                      <button class="control-button pause-button"><i class="fa-solid fa-pause"></i></button>
                      <button class="control-button send-button"><i class="fa-solid fa-paper-plane"></i></button>
                  </div>
              </div>
          </main>

          <!-- Divider -->
          <hr class="section-divider" />

          <!-- Publication History -->
          <section class="publication-history" v-if="!isLoading && !error && voiceNotes.length > 0">
              <h3 class="history-title">HISTORIQUE DES PUBLICATIONS ({{ voiceNotes.length }})</h3>
              <div class="history-items">
                  <div
                    v-for="note in voiceNotes"
                    :key="note.id"
                    class="history-item"
                    :class="{ 'playing': currentlyPlayingNoteId === note.id }"
                  >
                      <button class="play-button-small" @click="playPauseAudio(note)">
                          <i :class="['fa-solid', getIconClass(note.id)]"></i>
                      </button>
                      <div class="waveform-placeholder">
                          <div v-for="i in 170" :key="`note-${note.id}-bar-${i}`" :style="{ height: `${Math.random() * 80 + 10}%` }" class="bar"></div>
                      </div>
                      <!-- AJOUT: Conteneur pour durée et date -->
                      <div class="note-meta">
                           <span class="duration">{{ formatDuration(note.duration) }}</span>
                           <!-- AJOUT: Affichage de la date de création -->
                           <span class="publication-date">{{ formatDate(note.createdAt) }}</span>
                      </div>
                      <span class="speaker-icon"><i class="fa-solid fa-volume-high"></i></span>
                      <!-- AJOUT: Bouton de suppression -->
                      <button
                          class="delete-button"
                          @click="confirmDeleteNote(note.id)"
                          title="Supprimer cette note"
                      >
                          <i class="fa-solid fa-trash"></i>
                      </button>
                  </div>
              </div>
          </section>
          <section v-else-if="!isLoading && !error && voiceNotes.length === 0" class="publication-history">
               <h3 class="history-title">HISTORIQUE DES PUBLICATIONS</h3>
               <p>Vous n'avez pas encore publié de note vocale.</p>
          </section>
      </template>
  </div>

</template>

<script setup>
// MODIFICATION: Ajout de onUnmounted
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// --- State ---
const userProfile = ref(null);
const voiceNotes = ref([]);
const isLoading = ref(true);
const error = ref(null);
// MODIFICATION: Vérifie que le port 5000 est correct pour ton API
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// MODIFICATION: Ajout de apiUrlBase (URL racine de ton serveur pour les fichiers statiques)
const apiUrlBase = import.meta.env.VITE_API_URL_BASE || 'http://localhost:5000';

// --- État Audio ---
const currentAudio = ref(null);
const currentlyPlayingNoteId = ref(null);
const isPlayingState = ref(false);

// --- Fonctions (Non-Audio) ---

const getToken = () => {
  return localStorage.getItem('authToken');
};

const fetchUserProfile = async () => {
    const token = getToken();
    if (!token) { error.value = "Utilisateur non authentifié."; router.push('/login'); return; }
    try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Réponse non JSON' }));
            if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken');
                 error.value = `Session invalide ou expirée (${response.status}). Veuillez vous reconnecter.`;
                 router.push('/login'); return;
            }
            throw new Error(errorData.message || `Erreur ${response.status} lors de la récupération du profil.`);
        }
        const data = await response.json();
        if (data.status === 'success' && data.data?.user) {
            userProfile.value = {
                ...data.data.user,
                avatar: data.data.user.avatar ? `${apiUrlBase}${data.data.user.avatar}` : 'https://via.placeholder.com/120',
            };
        } else { throw new Error("Format de réponse invalide pour le profil utilisateur."); }
    } catch (err) {
        console.error("Erreur fetchUserProfile:", err);
        if (!error.value) { error.value = err.message || "Impossible de charger les informations du profil."; }
    }
};

const fetchUserVoiceNotes = async () => {
    const token = getToken();
    if (!token) { console.warn("fetchUserVoiceNotes: Token manquant."); return; }
    try {
        const response = await fetch(`${apiBaseUrl}/voice-notes/my-notes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Réponse non JSON' }));
            if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken');
                 if (!error.value) error.value = `Session invalide ou expirée (${response.status}) lors de la récupération des notes.`;
                 router.push('/login'); return;
            }
            throw new Error(errorData.message || `Erreur ${response.status} lors de la récupération des notes vocales.`);
        }
        const data = await response.json();
        if (data.status === 'success' && data.data?.voiceNotes) {
            voiceNotes.value = data.data.voiceNotes.map(note => ({
                ...note,
                audio_url: note.audio_url ? `${apiUrlBase}${note.audio_url}` : null
            }));
            console.log('Notes vocales chargées:', JSON.parse(JSON.stringify(voiceNotes.value))); // Log pour vérifier createdAt
        } else if (data.status === 'success') {
            voiceNotes.value = [];
            console.log('Aucune note vocale trouvée ou format de réponse inattendu:', data);
        } else { throw new Error("Format de réponse invalide ou échec récupération notes vocales."); }
    } catch (err) {
        console.error("Erreur fetchUserVoiceNotes:", err);
        const historyError = err.message || "Impossible de charger l'historique des publications.";
        error.value = error.value ? `${error.value}\n${historyError}` : historyError;
    }
};

const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// --- AJOUT: Fonction pour formater la date ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
         return date.toLocaleDateString(undefined, optionsDate); // Adapte 'undefined' par 'fr-FR' si besoin
    } catch (e) {
        console.error("Erreur de formatage de date:", e);
        return 'Date invalide';
    }
};

// --- AJOUT: Logique de suppression ---
const confirmDeleteNote = (noteId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette note vocale ? Cette action est irréversible.")) {
        deleteNote(noteId);
    }
};

const deleteNote = async (noteId) => {
    const token = getToken();
    if (!token) { error.value = "Authentification requise pour supprimer."; return; }

    console.log(`[Delete] Tentative de suppression de la note ID: ${noteId}`);
    // Optionnel: Mettre un état de chargement spécifique à la suppression
    // isDeleting.value = noteId; // Exemple

    try {
        const response = await fetch(`${apiBaseUrl}/voice-notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok && response.status === 204) {
            console.log(`[Delete] Note ID: ${noteId} supprimée avec succès.`);
            voiceNotes.value = voiceNotes.value.filter(note => note.id !== noteId);
            if (currentlyPlayingNoteId.value === noteId) { stopAndCleanupAudio(); }
            // Optionnel: Notification de succès
        } else {
            let errorMsg = `Erreur lors de la suppression (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
                 if (response.status === 401 || response.status === 403) {
                     localStorage.removeItem('authToken');
                     error.value = `Session invalide (${response.status}). Impossible de supprimer. Veuillez vous reconnecter.`;
                     router.push('/login'); return;
                 }
                 if (response.status === 404) {
                      errorMsg = "Note non trouvée. Elle a peut-être déjà été supprimée.";
                      voiceNotes.value = voiceNotes.value.filter(note => note.id !== noteId);
                 }
            } catch (jsonError) { errorMsg += ` (${response.statusText})`; }
            throw new Error(errorMsg);
        }
    } catch (err) {
        console.error(`[Delete] Erreur lors de la suppression de la note ID: ${noteId}`, err);
        error.value = err.message || "Une erreur est survenue lors de la tentative de suppression.";
        // Optionnel: Notification d'erreur
    } finally {
         // Optionnel: Arrêter l'état de chargement spécifique
         // isDeleting.value = null;
    }
};


// --- Fonctions Audio (Bloc inchangé) ---
const createAndSetupAudio = (audioUrl, noteId) => {
    console.log(`[AudioEngine] Création NOUVELLE instance Audio pour Note ID: ${noteId}, URL: ${audioUrl}`);
    const newAudioInstance = new Audio(audioUrl);
    const onPlayHandler = () => { if (currentAudio.value === newAudioInstance) { isPlayingState.value = true; } };
    const onPauseHandler = () => { if (currentAudio.value === newAudioInstance) { isPlayingState.value = false; } };
    const onEndedHandler = () => { if (currentAudio.value === newAudioInstance) { stopAndCleanupAudio(); } else { /*...*/ newAudioInstance.src = ''; } };
    const onErrorHandler = (e) => { handleAudioError(e, noteId); };
    newAudioInstance.addEventListener('play', onPlayHandler);
    newAudioInstance.addEventListener('pause', onPauseHandler);
    newAudioInstance.addEventListener('ended', onEndedHandler);
    newAudioInstance.addEventListener('error', onErrorHandler);
    return newAudioInstance;
};
const playPauseAudio = (note) => {
    const noteId = note.id;
    const audioUrl = note.audio_url;
    console.log(`[Audio Control] Clic sur Note ID: ${noteId}. Actuellement en lecture: ${currentlyPlayingNoteId.value}`);
    if (!audioUrl || audioUrl === apiUrlBase) { console.error('URL audio invalide...', audioUrl); alert("URL audio invalide."); return; }
    if (currentlyPlayingNoteId.value === noteId && currentAudio.value) {
        if (currentAudio.value.paused) { currentAudio.value.play().catch(err => handleAudioError(err, noteId)); }
        else { currentAudio.value.pause(); }
    } else {
        stopAndCleanupAudio();
        const newAudio = createAndSetupAudio(audioUrl, noteId);
        currentAudio.value = newAudio;
        currentlyPlayingNoteId.value = noteId;
        console.log(`[Audio Control] Démarrage lecture nouvelle instance (Note ID: ${noteId})`);
        newAudio.play().catch(err => { handleAudioError(err, noteId); });
    }
};
const handleAudioError = (e, noteIdOnError) => {
    console.error(`[Audio Error Handler] Erreur détectée pour Note ID ${noteIdOnError}:`, e);
    let message = `Erreur lecture note ${noteIdOnError}.`;
    let errorSource = null;
    if (e instanceof Event && e.target?.error) { errorSource = e.target.error; }
    else if (e instanceof DOMException) { errorSource = e; }
    if (errorSource) { /* ... Construction message d'erreur détaillé ... */ }
    else { message += ' Erreur inconnue.'; }
    alert(message);
    if (e instanceof Event && e.target instanceof HTMLAudioElement) { /* ... Nettoyage instance source ... */ e.target.src = ''; }
    if (currentlyPlayingNoteId.value === noteIdOnError) { stopAndCleanupAudio(); }
};
const stopAndCleanupAudio = () => {
    const audioToClean = currentAudio.value;
    const cleaningNoteId = currentlyPlayingNoteId.value;
    currentlyPlayingNoteId.value = null; isPlayingState.value = false;
    if (audioToClean) {
        console.log(`[Audio Cleanup] Nettoyage instance active (Note ID: ${cleaningNoteId})`);
        if (!audioToClean.paused) { audioToClean.pause(); }
        console.log('[Audio Cleanup] Calling load() to release resources.');
        audioToClean.load();
        console.warn("[Audio Cleanup] Retrait explicite écouteurs non implémenté.");
        currentAudio.value = null;
        console.log(`[Audio Cleanup] Nettoyage terminé (Note ID: ${cleaningNoteId}). Référence supprimée.`);
    }
};
const getIconClass = (noteId) => {
    if (currentlyPlayingNoteId.value !== noteId) { return 'fa-play'; }
    return isPlayingState.value ? 'fa-pause' : 'fa-play';
};


// --- Navigation ---
const goToEditProfile = () => {
  router.push('/edit-profile');
};

// --- Lifecycle Hooks ---
onMounted(async () => {
    console.log('[Lifecycle] Profile Page Mounted');
    isLoading.value = true; error.value = null;
    await fetchUserProfile();
    if (userProfile.value && !error.value) { await fetchUserVoiceNotes(); }
    isLoading.value = false;
    console.log('[Lifecycle] Initial loading complete.');
});
onUnmounted(() => {
    console.log('[Lifecycle] Profile Page Unmounted, cleaning up audio.');
    stopAndCleanupAudio();
});

</script>

<style scoped>
/* Styles généraux de la page (depuis ton code) */
.user-profile-page {
  background-color: #f0f0f7;
  font-family: sans-serif;
  color: #333;
  min-height: 100vh;
  padding-top: 20px;
}

/* Indicateur de chargement et message d'erreur */
.loading-indicator, .error-message {
  text-align: center;
  padding: 40px 20px; /* Augmenté le padding */
  font-weight: bold;
  font-size: 1.1em;
  margin: 20px 30px; /* Ajout marge */
  border-radius: 8px; /* Coins arrondis */
}
.loading-indicator {
    color: #555;
}
.error-message {
  color: #d9534f;
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  white-space: pre-wrap; /* Pour les retours à la ligne dans les erreurs */
}

/* Section Profil */
.profile-main {
  padding: 0 30px 30px 30px;
  position: relative;
  text-align: center;
}

.profile-banner {
  background-color: #f5a623;
  height: 150px;
  border-radius: 8px;
  position: relative;
}

.profile-tag {
  position: absolute;
  top: 10px;
  left: 15px;
  background-color: rgba(0, 0, 0, 0.2);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: bold;
}

.profile-details {
  margin-top: -70px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-picture-container {
    position: relative;
    display: inline-block;
}

.profile-picture {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 4px solid #f0f0f7;
  object-fit: cover;
  display: block;
  margin: 0 auto;
  background-color: #eee; /* Placeholder color */
}

.edit-profile-button {
  position: absolute;
  bottom: 5px;
  right: -15px;
  background-color: #ff9933;
  color: white;
  border: none;
  border-radius: 15px;
  padding: 5px 15px;
  font-size: 1.2em;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;
}
 .edit-profile-button:hover {
    background-color: #e68a00; /* Slightly darker orange */
 }

.user-name {
  margin-top: 15px;
  margin-bottom: 5px;
  font-size: 2em;
  font-weight: bold;
}

.user-bio {
  color: #555;
  font-size: 0.95em;
  margin-bottom: 15px;
  max-width: 400px;
  line-height: 1.5; /* Améliore lisibilité */
}

/* Audio Recorder (Visuel seulement pour l'instant) */
.audio-recorder {
  background-color: #fff;
  border-radius: 15px;
  padding: 25px;
  margin: 30px auto;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.mic-button-wrapper {
    background-color: #fff;
    border-radius: 50%;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.mic-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 1.8em;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.mic-button:hover {
    background-color: #2563eb;
}

.timestamp {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 20px;
  font-family: 'Courier New', Courier, monospace;
}

.recorder-controls {
  display: flex;
  gap: 20px;
  align-items: center;
}

.control-button {
  background-color: #fff;
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: 1.2em;
  color: #555;
  transition: transform 0.1s, box-shadow 0.1s;
  border: 1px solid #ccc;
}
.control-button:active {
    transform: scale(0.95);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.control-button.pause-button { color: #ef4444; font-size: 1em; }
.control-button.send-button { background-color: #3b82f6; color: white; width: 55px; height: 55px; font-size: 1.5em; }

/* Divider */
.section-divider {
  border: none;
  border-top: 1px solid #3d3d3d;
  margin: 30px 0;
}

/* Historique des publications */
.publication-history {
  padding: 0 30px 30px 30px;
}

.history-title {
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
  color: #444;
  margin-bottom: 25px;
}

.history-items {
  display: grid;
  grid-template-columns: 1fr; /* Force 2 colonnes */
  gap: 20px;
  max-width: 1000px; /* Limite la largeur totale de la grille (ajuste si besoin) */
  margin-left: auto; /* Centre la grille */
  margin-right: auto; /* Centre la grille */
}

.history-item {
  background-color: #fff;
  border-radius: 15px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px; /* AJOUT: Espace entre éléments ajusté */
  transition: background-color 0.3s, box-shadow 0.3s; /* Animation douce */
  border: 1px solid #ccc; /* Bordure initiale transparente */
}

/* Style pour l'élément en cours de lecture */
.history-item.playing {
  background-color: #bac0f1; /* Légèrement plus foncé */
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); /* Ombre bleue légère */
  border-color: #a3a8e4; /* Bordure subtile */
}

.play-button-small {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 1em;
  transition: background-color 0.2s, transform 0.1s;
}
.play-button-small:hover {
    background-color: #2563eb;
}
.play-button-small:active {
    transform: scale(0.9);
}

.waveform-placeholder {
  flex-grow: 1;
  background-color: #fff;
  border-radius: 10px;
  height: 40px;
  display: flex;
  align-items: flex-end; /* Aligner les barres en bas */
  overflow: hidden;
  padding: 5px; /* Espace intérieur */
  gap: 2px; /* Espace entre les barres */
  margin: 0 5px; /* AJOUT: Marge réduite pour laisser place à date/delete */
}

.bar {
  display: inline-block;
  width: 3px; /* Barres légèrement plus épaisses */
  background-color: #a5b4fc; /* Bleu indigo clair */
  flex-shrink: 0;
  border-radius: 1px; /* Coins arrondis légers */
  transition: background-color 0.3s; /* Animation couleur */
  /* Hauteur via style inline */
}
/* Style pour les barres pendant la lecture */
.history-item.playing .bar {
    background-color: #3b82f6; /* Bleu vif pendant lecture */
}

/* AJOUT: Conteneur pour les métadonnées (durée + date) */
.note-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 60px;
    text-align: right;
    gap: 2px;
    flex-shrink: 0;
    margin: 0 5px; /* AJOUT: Marge réduite */
}

.duration {
  font-size: 0.9em;
  color: #555;
  flex-shrink: 0;
  font-family: 'Courier New', Courier, monospace;
  /* min-width/text-align gérés par note-meta */
}

/* AJOUT: Style pour la date de publication */
.publication-date {
    font-size: 0.75em;
    color: #777;
    white-space: nowrap;
}

.speaker-icon {
  font-size: 1.1em;
  color: #555;
  flex-shrink: 0;
}

/* AJOUT: Style pour le bouton de suppression */
.delete-button {
    background: none;
    border: none;
    color: #dc3545; /* Rouge danger */
    cursor: pointer;
    font-size: 1.1em;
    padding: 5px 8px;
    margin-left: auto; /* Pousse à droite */
    transition: color 0.2s, transform 0.1s;
    line-height: 1;
    flex-shrink: 0;
}

.delete-button:hover {
    color: #a91e22;
}
.delete-button:active {
    transform: scale(0.9);
}



</style>