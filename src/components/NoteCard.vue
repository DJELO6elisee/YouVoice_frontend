<template>
  <div class="note-card">
    <div class="card-header">
      <img :src="creatorAvatarUrl" alt="User Avatar" class="avatar" />
      <div class="info">
        <span class="name">{{ note.user?.username || 'Utilisateur inconnu' }}</span>
        <span class="timestamp">{{ relativeTimestamp }}</span>
      </div>
    </div>

    <div class="audio-player">
      <button class="play-button" @click="togglePlayPause" :disabled="!audioSourceUrl || !!audioError">
        <i :class="['fa-solid', isPlaying ? 'fa-pause' : 'fa-play']"></i>
      </button>
      <div class="waveform">
        <!-- Waveform Statique -->
        <div v-for="i in 170" :key="i" :style="{ height: `${Math.random() * 80 + 10}%` }" class="bar"></div>
      </div>
      <span class="duration">{{ formattedDuration }}</span>
      <button class="volume-button" title="Volume"><i class="fa-solid fa-volume-high"></i></button>
    </div>

    <!-- Affichage Erreur Audio -->
    <div v-if="audioError" class="error-message audio-error">
        <i class="fa-solid fa-circle-exclamation"></i> {{ audioError }}
    </div>
    <!-- Message Action en cours -->
     <div v-if="isProcessingAction" class="status-message action-status">
        <i class="fa-solid fa-spinner fa-spin"></i> Action en cours...
     </div>

    <!-- Actions : Réactions et Signalement -->
        <!-- Actions : Réactions, Signalement et Partage -->
        <div class="card-actions">
      <!-- Groupe de gauche : Réactions -->
      <div class="reaction-buttons">
        <button
          class="like-button heart-button"
          :class="{ 'reacted': currentUserReaction === '❤️' }"
          @click="handleReaction('❤️')"
          :disabled="isProcessingAction"
          title="Aimer"
        >
          <i class="fa-solid fa-heart"></i>
          <span class="count">{{ heartCount }}</span>
        </button>
        <button
            class="like-button thumbs-up-button"
            :class="{ 'reacted': currentUserReaction === '👍' }"
            @click="handleReaction('👍')"
            :disabled="isProcessingAction"
            title="J'aime"
        >
            <i class="fa-solid fa-thumbs-up"></i>
            <span class="count">{{ thumbsUpCount }}</span>
        </button>
      </div>

      <!-- NOUVEAU: Groupe de droite pour Signalement et Partage -->
      <div class="action-icons-right">
          <!-- Icône/Bouton de Signalement (existante) -->
          <div class="warning-icon" title="Signaler">
             <button class="report-button" @click="reportNote" :disabled="isProcessingAction">
                 <i class="fa-solid fa-triangle-exclamation"></i>
             </button>
          </div>

          <!-- NOUVELLE Icône/Bouton de Partage -->
          <div class="share-icon" title="Partager">
             <button class="share-button" @click="handleShare" :disabled="isProcessingAction">
              <i class="fa-solid fa-share-nodes"></i>
             </button>
          </div>
      </div>
      <!-- FIN NOUVEAU Groupe -->
      <div v-if="reportError" class="error-message report-error"> <!-- Nouvelle classe CSS si besoin -->
        <i class="fa-solid fa-circle-exclamation"></i> {{ reportError }}
      </div>
    </div>
    <!-- FIN Actions -->

    <!-- Zone de Saisie Commentaire -->
    <div class="comment-input-area">
      <input
        type="text"
        placeholder="Écrire un commentaire..."
        class="comment-input"
        v-model="newCommentText"
        @keyup.enter="submitComment"
        :disabled="isProcessingAction"
      />
      <button class="mic-button" title="Commentaire vocal (non impl.)"><i class="fa-solid fa-microphone"></i></button>
      <button
        class="send-comment-button"
        @click="submitComment"
        :disabled="!newCommentText.trim() || isProcessingAction"
        title="Envoyer commentaire"
       >
         <i class="fa-solid fa-paper-plane"></i>
       </button>
    </div>
    <!-- Affichage Erreurs Commentaire/Réaction -->
     <div v-if="commentError" class="error-message comment-error">
        <i class="fa-solid fa-circle-exclamation"></i> {{ commentError }}
    </div>
     <div v-if="reactionError" class="error-message reaction-error">
        <i class="fa-solid fa-circle-exclamation"></i> {{ reactionError }}
    </div>

    <!-- === SECTION COMMENTAIRES MISE À JOUR (Affichage limité + Popover) === -->
    <div class="comments-display-section"> <!-- Classe renommée pour clarté -->
        <!-- Affichage des 2 derniers commentaires par défaut -->
        <!-- Utilise la computed property 'defaultDisplayedComments' (définie dans le script) -->
        <div v-if="defaultDisplayedComments.length > 0" class="default-comments-list">
            <div v-for="comment in defaultDisplayedComments" :key="comment.id" class="comment-item">
                 <p class="comment-content">
                    <span class="commenter-name">{{ comment.user?.username || 'Quelqu\'un' }}:</span>
                    {{ comment.text }}
                </p>
            </div>
        </div>
        <!-- Message si aucun commentaire -->
        <div v-else-if="!props.note.comments || props.note.comments.length === 0" class="comment-preview placeholder">
            <p>Soyez le premier à commenter !</p>
        </div>

        <!-- Bouton pour ouvrir le Popover (s'affiche si plus de 2 commentaires) -->
        <!-- Condition vérifie s'il y a PLUS de 2 commentaires -->
        <button
            v-if="props.note.comments && props.note.comments.length > 2"
            @click="openCommentsPopover"
            class="show-all-comments-button"
            title="Voir tous les commentaires"
        >
            Voir les {{ props.note.comments.length }} commentaires
            <i class="fa-solid fa-chevron-down"></i> <!-- Icône ajoutée -->
        </button>

        <!-- Le Popover des Commentaires (caché par défaut via v-if) -->
        <!-- Structure ajoutée, conditionnée par 'isCommentsPopoverVisible' (définie dans le script) -->
        <!-- @click.self permet de fermer en cliquant sur le fond noir semi-transparent -->
        <div v-if="isCommentsPopoverVisible" class="comments-popover-overlay" @click.self="closeCommentsPopover">
            <div class="comments-popover-content">
                <div class="popover-header">
                    <h3>Tous les commentaires ({{ props.note.comments.length }})</h3>
                    <!-- Bouton pour fermer (appelle la méthode définie dans le script) -->
                    <button @click="closeCommentsPopover" class="close-popover-button" title="Fermer">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="popover-body">
                    <!-- Liste de TOUS les commentaires dans le popover -->
                    <div v-if="props.note.comments && props.note.comments.length > 0" class="all-comments-list">
                        <!-- Itère sur TOUS les props.note.comments ici -->
                        <div v-for="comment in props.note.comments" :key="comment.id" class="comment-item popover-comment-item">
                            <p class="comment-content">
                                <span class="commenter-name">{{ comment.user?.username || 'Quelqu\'un' }}:</span>
                                {{ comment.text }}
                                <!-- Vous pouvez ajouter timestamp/avatar spécifiques au popover ici -->
                            </p>
                        </div>
                    </div>
                    <div v-else> <!-- Ne devrait normalement pas être visible si le bouton "Voir plus" apparaît -->
                        <p>Aucun commentaire.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- === FIN Section Commentaires === -->


    <audio ref="audioElement" preload="metadata"></audio>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

// --- Props ---
const props = defineProps({
  note: {
    type: Object,
    required: true,
    default: () => ({
        id: null,
        user: { id: null, username: 'Inconnu', avatar: null },
        audio_url: null,
        duration: 0,
        createdAt: new Date().toISOString(),
        comments: [],
        reactions: []
    })
  },
  currentUserId: { type: [String, Number], required: true },
  backendUrl: { type: String, required: true, default: 'http://localhost:5000' }
});

// ====> AJOUT : État pour la visibilité du Popover (placé ici car utilisé globalement)
const isCommentsPopoverVisible = ref(false);

const emit = defineEmits(['error', 'comment-added', 'reaction-toggled', 'note-reported', 'update:note']);

// --- Reactive State --- (Existants)
const isPlaying = ref(false);
const currentTime = ref(0);
const audioError = ref('');
const commentError = ref('');
const reactionError = ref('');
const newCommentText = ref('');
const isProcessingAction = ref(false);
const audioElement = ref(null);

// --- Computed Properties --- (Existants)

const audioSourceUrl = computed(() => {
    if (!props.note.audio_url) {
        // console.warn(`[Audio URL ${props.note.id}] audio_url manquant.`); // Moins de bruit en console
        return null;
    }
    try {
        return new URL(props.note.audio_url, props.backendUrl).href;
    } catch (e) {
        console.error(`[Audio URL ${props.note.id}] Erreur construction URL pour ${props.note.audio_url} avec base ${props.backendUrl}:`, e);
        return null;
    }
});
const creatorAvatarUrl = computed(() => {
    const placeholderUrl = 'https://via.placeholder.com/40?text=?';
    const avatarPath = props.note?.user?.avatar;
    const backendBaseUrl = props.backendUrl;
    if (!avatarPath) return placeholderUrl;
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath;
    if (!backendBaseUrl) return placeholderUrl;
    try {
        return new URL(avatarPath, backendBaseUrl).href;
    } catch (error) {
        console.error(`[Avatar NoteCard ${props.note.id}] Erreur URL pour ${avatarPath} base ${backendBaseUrl}:`, error);
        return placeholderUrl;
    }
});
const formattedDuration = computed(() => {
    const totalSeconds = Math.round(props.note.duration || 0);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins)}:${String(secs).padStart(2, '0')}`;
});
const relativeTimestamp = computed(() => {
    if (!props.note.createdAt) return '';
    try {
        const now = new Date();
        const past = new Date(props.note.createdAt);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
        if (diffInSeconds < 1) return 'maintenant';
        if (diffInSeconds < 60) return `${diffInSeconds} s`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} min`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} h`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays <= 7) return `${diffInDays} j`;
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return past.toLocaleDateString(undefined, options);
    } catch (e) {
        console.error("Erreur formatage timestamp:", e);
        return "Date invalide";
    }
});
const reactionCounts = computed(() => {
    const counts = { '❤️': 0, '👍': 0 };
    if (Array.isArray(props.note.reactions)) {
        props.note.reactions.forEach(r => {
            if (counts[r.emoji] !== undefined) counts[r.emoji]++;
        });
    }
    return counts;
});
const heartCount = computed(() => reactionCounts.value['❤️']);
const thumbsUpCount = computed(() => reactionCounts.value['👍']);
const currentUserReaction = computed(() => {
    if (!props.currentUserId || !Array.isArray(props.note.reactions)) return null;
    const currentUserIdStr = String(props.currentUserId);
    // Trouver la réaction de l'utilisateur courant pour cette note
    const reaction = props.note.reactions.find(r => String(r.user_id) === currentUserIdStr);
    return reaction ? reaction.emoji : null;
});

// ====> AJOUT : Computed pour les 2 derniers commentaires à afficher par défaut
const defaultDisplayedComments = computed(() => {
    // Vérifie si props.note.comments est bien un tableau avant de slicer
    if (Array.isArray(props.note.comments)) {
        // Prend les 2 derniers commentaires. S'il y en a moins de 2, prend tout.
        return props.note.comments.slice(-2);
    }
    return []; // Retourne un tableau vide si non défini ou pas un tableau
});


// --- Helper: Get Auth Token --- (Existant)
const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    // Note : L'erreur est déjà loguée si non trouvé, pas besoin de répéter ici.
    return token;
};

// --- Methods --- (Existants)

// -- Audio Handlers --
const handlePlay = () => {
    console.log(`[Audio Event Play ${props.note.id}] Audio is playing.`);
    isPlaying.value = true;
    if (audioError.value.includes("Interaction requise")) {
         audioError.value = '';
    }
};
const handlePause = () => {
    console.log(`[Audio Event Pause ${props.note.id}] Audio paused.`);
    isPlaying.value = false;
};
const togglePlayPause = () => {
  if (!audioElement.value) {
    audioError.value = "Lecteur audio non initialisé.";
    console.error("Audio element ref is NULL.");
    return;
  }
   if (!audioSourceUrl.value) {
       audioError.value = "Source audio invalide ou manquante.";
       return;
   }
   if (!audioError.value || audioError.value.includes("Interaction") || audioError.value.includes("lecture") || audioError.value.includes("bloquée") || audioError.value.includes("annulée")) {
        audioError.value = '';
   } else {
       console.warn("Play attempt blocked due to persistent audio error:", audioError.value);
       return;
   }

  if (isPlaying.value) {
    audioElement.value.pause();
  } else {
    const playPromise = audioElement.value.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {}).catch(error => {
            console.error(`[Audio Play ${props.note.id}] Error trying to play audio:`, error);
            if (error.name === 'NotAllowedError') {
                 audioError.value = "Interaction requise pour démarrer l'audio.";
            } else {
                 handleAudioElementError({ target: audioElement.value });
            }
            if (isPlaying.value) { isPlaying.value = false; }
        });
    }
  }
};
const handleTimeUpdate = () => {
    if (audioElement.value && !isNaN(audioElement.value.currentTime)) {
        currentTime.value = audioElement.value.currentTime;
    }
};
const handleAudioEnded = () => {
    console.log(`[Audio Ended ${props.note.id}] Audio finished.`);
    isPlaying.value = false;
    currentTime.value = 0;
    if (audioElement.value) { audioElement.value.currentTime = 0; }
};
const handleAudioElementError = (e) => {
    const error = e.target?.error;
    console.error(`[Audio Error ${props.note.id}] HTMLAudioElement error:`, error);
    if (error) {
        switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED: audioError.value = 'Lecture annulée.'; break;
            case MediaError.MEDIA_ERR_NETWORK: audioError.value = 'Erreur réseau audio.'; break;
            case MediaError.MEDIA_ERR_DECODE: audioError.value = 'Erreur décodage audio.'; break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: audioError.value = 'Format/URL non supporté.'; break;
            default: audioError.value = `Erreur audio (code ${error.code})`;
        }
    } else {
        audioError.value = 'Erreur audio inconnue.';
    }
    isPlaying.value = false;
};

// -- Options (Placeholder) --
const showOptions = () => { console.log('Options clicked'); alert("Options non implémentées"); };

// --- Fonction handleReaction --- (Existante)
const handleReaction = async (emoji) => {
  if (isProcessingAction.value) return;
  isProcessingAction.value = true;
  reactionError.value = ''; // Reset error
  const token = getAuthToken();
  console.log('[Handle Reaction] Token:', token ? 'Present' : 'MISSING!'); // Log Token Presence
  if (!token) {
      reactionError.value = "Authentification requise.";
      isProcessingAction.value = false;
      return;
  }

  const currentReaction = currentUserReaction.value;
  const currentUserIdStr = String(props.currentUserId); // Ensure string comparison
  console.log(`[Handle Reaction ${props.note.id}] User ${currentUserIdStr}, Clicked Emoji: ${emoji}, Current Reaction: ${currentReaction}`);

  // --- !! POINT CRITIQUE: Adapter la logique METHOD/URL/BODY à votre API !! ---
  const method = 'POST';
  const requestUrl = `${props.backendUrl}/api/reactions`;
  let requestBody = JSON.stringify({ voiceNoteId: props.note.id, emoji: emoji });
  // --- Fin du point critique ---

  console.log(`[Handle Reaction ${props.note.id}] Sending Request:`, { method, requestUrl, body: requestBody });

  try {
    const response = await fetch(requestUrl, {
      method: method,
      headers: {
          ...(requestBody && { 'Content-Type': 'application/json' }),
          'Authorization': `Bearer ${token}`
      },
      body: requestBody
    });

    console.log(`[Handle Reaction ${props.note.id}] Response Status: ${response.status}`);

    let result = null;
    let updatedReactionsList = null;

    if (response.status === 204) {
        console.log(`[Handle Reaction ${props.note.id}] Received 204 No Content.`);
        updatedReactionsList = (props.note.reactions || []).filter(r =>
            !(String(r.user_id) === currentUserIdStr && r.emoji === emoji)
        );
    } else if (response.ok) {
        try {
            result = await response.json();
            console.log(`[Handle Reaction ${props.note.id}] Response Body:`, result);
            if (Array.isArray(result.data?.reactions)) { updatedReactionsList = result.data.reactions; }
            else if (Array.isArray(result.reactions)) { updatedReactionsList = result.reactions; }
            else if (result.data?.note?.reactions && Array.isArray(result.data.note.reactions)) { updatedReactionsList = result.data.note.reactions; }
            else if (result.status === 'success' || result.message || typeof result === 'object') {
                 console.warn(`[Handle Reaction ${props.note.id}] API success but no list.`);
                 const currentReactions = props.note.reactions || [];
                 const existingReactionIndex = currentReactions.findIndex(r => String(r.user_id) === currentUserIdStr);
                 if (currentReaction === emoji) { updatedReactionsList = currentReactions.filter(r => !(String(r.user_id) === currentUserIdStr && r.emoji === emoji)); }
                 else if (existingReactionIndex > -1) { updatedReactionsList = currentReactions.map((r, index) => index === existingReactionIndex ? { ...r, emoji: emoji } : r ); }
                 else { const newReactionPlaceholder = { user_id: props.currentUserId, emoji: emoji, id: Date.now() + Math.random() }; updatedReactionsList = [...currentReactions, newReactionPlaceholder]; }
            } else { console.warn("[Handle Reaction] Unknown structure:", result); reactionError.value = "Format réponse réaction inconnu."; }
        } catch (jsonError) { console.error(`[Handle Reaction ${props.note.id}] JSON parse error:`, jsonError); reactionError.value = "Erreur lecture réponse (JSON)."; updatedReactionsList = null; }
    } else {
        let errorMsg = `Erreur ${response.status}`;
        try { const errData = await response.json(); errorMsg = errData.message || errData.error || errorMsg; } catch (e) { console.log(`[Handle Reaction ${props.note.id}] Error response not JSON.`); }
        throw new Error(errorMsg);
    }

    if (updatedReactionsList !== null) {
         const updatedNoteData = { ...props.note, reactions: updatedReactionsList };
         console.log(`[Handle Reaction ${props.note.id}] Emitting update:note`, updatedNoteData);
         emit('update:note', updatedNoteData);
         emit('reaction-toggled', { noteId: props.note.id, reactions: updatedReactionsList });
    } else if (!reactionError.value && response.ok) { reactionError.value = "Impossible maj réactions."; }

  } catch (error) { console.error(`[Handle Reaction ${props.note.id}] Failed:`, error); reactionError.value = error.message || "Erreur réaction."; emit('error', reactionError.value); }
  finally { isProcessingAction.value = false; }
};

// --- Fonction submitComment --- (Existante)
const submitComment = async () => {
  const text = newCommentText.value.trim();
  if (!text || isProcessingAction.value) return;
  isProcessingAction.value = true;
  commentError.value = '';
  const token = getAuthToken();
  if (!token) { commentError.value = "Authentification requise."; isProcessingAction.value = false; return; }
  const payload = { voiceNoteId: props.note.id, text: text };
  const apiUrl = `${props.backendUrl}/api/comments`;
  console.log(`[Submit Comment ${props.note.id}] Sending to ${apiUrl}`, payload);
  try {
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
    console.log(`[Submit Comment ${props.note.id}] Response Status: ${response.status}`);
    let responseBody;
    try { responseBody = await response.json(); console.log(`[Submit Comment ${props.note.id}] Response Body:`, responseBody); }
    catch (jsonError) {
        console.error(`[Submit Comment ${props.note.id}] JSON parse error:`, jsonError);
        try { const textResponse = await response.text(); console.log(`Response Text:`, textResponse); } catch (textError) {}
        if (!response.ok) { throw new Error(`Erreur serveur (${response.status}) - non JSON`); }
        throw new Error("Réponse OK mais non JSON.");
    }
    if (!response.ok) { const errorMsg = responseBody?.message || responseBody?.error || `Erreur serveur (${response.status})`; throw new Error(errorMsg); }
    const newCommentData = responseBody.data?.comment || responseBody.comment || responseBody;
    if (newCommentData?.id && newCommentData.text && newCommentData.user?.id && newCommentData.user?.username) {
         console.log(`[Submit Comment ${props.note.id}] Success!`, newCommentData);
         const currentComments = Array.isArray(props.note.comments) ? props.note.comments : [];
         const updatedComments = [...currentComments, newCommentData];
         const updatedNoteData = { ...props.note, comments: updatedComments };
         console.log(`[Submit Comment ${props.note.id}] Emitting update:note`);
         emit('update:note', updatedNoteData);
         emit('comment-added', newCommentData);
         newCommentText.value = '';
    } else { console.warn("[Submit Comment] Response mismatch:", responseBody); commentError.value = "Réponse serveur com inattendue."; }
  } catch (error) { console.error(`[Submit Comment ${props.note.id}] Failed:`, error); commentError.value = error.message || "Erreur ajout com."; emit('error', commentError.value); }
  finally { isProcessingAction.value = false; }
};

// --- Signalement (Placeholder) --- (Existant)
const reportNote = async () => {
    // Ne pas permettre plusieurs signalements simultanés
    if (isProcessingAction.value) return;

    // Demander confirmation à l'utilisateur
    const reason = prompt("Veuillez indiquer la raison de votre signalement (minimum 5 caractères) :");

    // Vérifier si l'utilisateur a annulé ou n'a pas fourni de raison suffisante
    if (reason === null) { // L'utilisateur a cliqué sur "Annuler"
        console.log("[ReportNote] Signalement annulé par l'utilisateur.");
        return;
    }
    if (reason.trim().length < 5) {
        reportError.value = "La raison fournie est trop courte (minimum 5 caractères).";
        // Afficher l'erreur à l'utilisateur (via v-if="reportError" dans le template)
        // Vous pouvez utiliser une alerte ou un message plus intégré
         alert("La raison fournie est trop courte (minimum 5 caractères).");
        return;
    }

    // Récupérer le token d'authentification
    const token = getAuthToken(); // Utilise votre helper existant
    if (!token) {
        reportError.value = "Vous devez être connecté pour signaler une note.";
         alert("Vous devez être connecté pour signaler une note."); // Ou rediriger vers login
        return;
    }

    // Début du traitement API
    isProcessingAction.value = true;
    reportError.value = ''; // Réinitialiser l'erreur précédente

    // Endpoint API pour créer un signalement
    // Adaptez '/api/reports' si votre route est différente (ex: '/api/auth/reports')
    const apiUrl = `${props.backendUrl}/api/reports`;

    console.log(`[ReportNote] Envoi du signalement pour la note ${props.note.id} vers ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json' // Bonne pratique
            },
            body: JSON.stringify({
                voiceNoteId: props.note.id, // ID de la note signalée
                reason: reason.trim()       // Raison fournie par l'utilisateur
            })
        });

        const responseData = await response.json(); // Tenter de lire la réponse JSON

        if (!response.ok) {
            // Utiliser le message d'erreur de l'API s'il existe
            throw new Error(responseData.message || `Erreur ${response.status} lors du signalement.`);
        }

        // Succès !
        console.log("[ReportNote] Signalement réussi:", responseData);
        alert("Votre signalement a bien été enregistré. Merci."); // Message de succès

        // Optionnel: Mettre à jour l'UI pour indiquer que la note a été signalée par cet utilisateur ?
        // emit('note-reported', props.note.id);

    } catch (error) {
        console.error("[ReportNote] Échec du signalement:", error);
        reportError.value = error.message || "Une erreur est survenue lors de l'envoi du signalement.";
        // Afficher l'erreur à l'utilisateur
         alert(`Erreur: ${reportError.value}`);

    } finally {
        isProcessingAction.value = false; // Réactiver les boutons
    }
};

// ====> AJOUT : Méthodes pour gérer le Popover
const openCommentsPopover = () => {
    console.log("Opening comments popover"); // Pour débogage
    isCommentsPopoverVisible.value = true;
};

const closeCommentsPopover = () => {
    console.log("Closing comments popover"); // Pour débogage
    isCommentsPopoverVisible.value = false;
};

// --- Lifecycle Hooks & Watchers --- (Existants)
const initializeAudio = () => {
     audioError.value = ''; isPlaying.value = false; currentTime.value = 0;
     if (audioElement.value) {
         audioElement.value.removeEventListener('play', handlePlay); audioElement.value.removeEventListener('pause', handlePause); audioElement.value.removeEventListener('timeupdate', handleTimeUpdate); audioElement.value.removeEventListener('ended', handleAudioEnded); audioElement.value.removeEventListener('error', handleAudioElementError);
         if (audioSourceUrl.value) {
             if (audioElement.value.src !== audioSourceUrl.value) { audioElement.value.src = audioSourceUrl.value; audioElement.value.load(); }
             else if (!isPlaying.value && audioElement.value.readyState >= 2) { audioElement.value.currentTime = 0; }
             audioElement.value.addEventListener('play', handlePlay); audioElement.value.addEventListener('pause', handlePause); audioElement.value.addEventListener('timeupdate', handleTimeUpdate); audioElement.value.addEventListener('ended', handleAudioEnded); audioElement.value.addEventListener('error', handleAudioElementError);
         } else { audioElement.value.src = ''; console.warn(`[Init Audio ${props.note.id}] No valid audio source URL.`); }
     } else { console.error(`[Init Audio ${props.note.id}] audioElement ref is NULL!`); }
};

onMounted(() => {
    nextTick(() => {
        if (audioElement.value) { console.log(`[Mounted ${props.note.id}] Audio element found. Initializing.`); initializeAudio(); }
        else { console.error(`[Mounted ${props.note.id}] Audio element ref is NULL!`); }
    });
});

onUnmounted(() => {
  console.log(`[Unmounted ${props.note.id}] Cleaning up.`);
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.removeEventListener('play', handlePlay); audioElement.value.removeEventListener('pause', handlePause); audioElement.value.removeEventListener('timeupdate', handleTimeUpdate); audioElement.value.removeEventListener('ended', handleAudioEnded); audioElement.value.removeEventListener('error', handleAudioElementError);
    audioElement.value.src = ''; audioElement.value.removeAttribute('src'); audioElement.value.load();
  }
});

watch(() => audioSourceUrl.value, (newUrl, oldUrl) => { if (newUrl !== oldUrl) { console.log(`[Watch URL ${props.note.id}] URL changed. Re-initializing.`); initializeAudio(); } });
watch(() => props.note, (newNote, oldNote) => {
    console.log(`[Watch Note ${props.note.id}] Note prop changed.`);
    if (newNote?.id !== oldNote?.id) { commentError.value = ''; reactionError.value = ''; }
}, { deep: true });



const handleShare = async () => {
    // Vérifier si l'API Web Share est supportée par le navigateur
    if (navigator.share) {
        // --- Prépare les données à partager ---
        // Idéalement, l'URL pointe vers une page publique de VOTRE application
        // où l'on peut écouter cette note spécifique.
        // Si vous n'avez pas de page par note, utilisez l'URL de la note ou une URL générique.
        const shareUrl = `${window.location.origin}/note/${props.note.id}`; // Exemple d'URL - Adaptez !
        const shareTitle = `Note vocale de ${props.note.user?.username || 'quelqu\'un'}`;
        const shareText = `Écoutez cette note vocale sur ${window.location.hostname} !`; // Texte optionnel

        const shareData = {
            title: shareTitle,
            text: shareText,
            url: shareUrl,
        };

        console.log("[Share] Attempting Web Share with data:", shareData);

        try {
            await navigator.share(shareData);
            console.log('[Share] Partage réussi via Web Share API.');
            // --- Appel au backend pour enregistrer le partage ---
            // On enregistre après que l'utilisateur a confirmé le partage natif
            // On peut utiliser une valeur générique pour shared_to ou essayer de deviner
            logShareToBackend('web_share_api'); // Enregistre que le partage a été initié
        } catch (err) {
            // L'utilisateur a annulé le partage ou une erreur est survenue
            console.error('[Share] Erreur Web Share API:', err.name, err.message);
            if (err.name !== 'AbortError') { // Ne pas afficher d'erreur si l'utilisateur annule simplement
                // Peut-être afficher une erreur discrète à l'utilisateur ici
                reactionError.value = "Le partage a échoué."; // Utilise reactionError ou créez shareError
            }
        }
    } else {
        // --- Fallback si Web Share API n'est pas supportée ---
        console.warn('[Share] Web Share API non supportée. Affichage fallback (ou message).');
        // Ici, vous pourriez :
        // 1. Afficher un message : "Votre navigateur ne supporte pas le partage direct."
        // 2. Afficher un petit modal avec des liens de partage manuels (Facebook, Twitter, Copier le lien)
        // 3. Implémenter la copie du lien dans le presse-papiers
        const shareUrl = `${window.location.origin}/note/${props.note.id}`; // Adaptez l'URL
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('Lien de la note copié dans le presse-papiers !');
            // Enregistrer le partage "copy_link" au backend
            logShareToBackend('copy_link');
        } catch (err) {
            console.error('[Share] Erreur copie lien:', err);
            alert("Impossible de copier le lien. Veuillez le faire manuellement.");
        }
    }
};

// ====> NOUVEAU : Fonction pour appeler le backend et enregistrer le partage
const logShareToBackend = async (platform) => {
    const token = getAuthToken();
    if (!token) {
        console.warn("[Share Log] Authentification requise pour enregistrer le partage.");
        return; // Ne pas bloquer l'action de partage si l'enregistrement échoue silencieusement
    }

    // *** IMPORTANT : Vous devez créer cet endpoint dans votre backend ***
    const apiUrl = `${props.backendUrl}/api/shares`; // Exemple d'URL pour l'API de partage

    console.log(`[Share Log] Sending POST to ${apiUrl} for note ${props.note.id}, platform: ${platform}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                voiceNoteId: props.note.id,
                sharedTo: platform // Utilise la plateforme détectée ou 'web_share_api' / 'copy_link'
            })
        });

        if (!response.ok) {
            // Log l'erreur mais ne pas nécessairement la montrer à l'utilisateur final
            console.error(`[Share Log] Erreur ${response.status} lors de l'enregistrement du partage.`);
            try {
                 const errData = await response.json();
                 console.error('[Share Log] Error details:', errData);
            } catch(e) {}
        } else {
            console.log('[Share Log] Partage enregistré avec succès au backend.');
            // Pas besoin d'afficher un succès à l'utilisateur ici normalement
        }
    } catch (error) {
        console.error('[Share Log] Échec de l\'appel API pour enregistrer le partage:', error);
    }
};

</script>


<style scoped>
  .note-card {
    background-color: #fff;
    border-radius: 25px;
    padding: 20px;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    width: 100%;
    /* --- AJOUTS --- */
    max-width: 800px;
    box-sizing: border-box;

  
  }
  
  /* ... le reste de vos styles ... */
  
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .card-header .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
  }
  
  .card-header .info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  
  .card-header .name {
    font-weight: bold;
    font-size: 30px;
    color: #000;
  }
  
  .card-header .timestamp {
    font-size: 12px;
    color: #000; /* Lighter grey text */
  }
  
  .options-button {
      background: none;
      border: none;
      color: #a0aec0;
      font-size: 20px;
      cursor: pointer;
  }
  
  .audio-player {
    display: flex;
    align-items: center;
    background-color: #FFFF; /* Slightly darker background for player */
    border-radius: 25px;
    padding: 8px 15px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
  }
  
  .play-button {
    background-color: #2b58d4; /* Light grey background for play */
    color: #FFFF; /* Dark icon color */
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-right: 10px;
    flex-shrink: 0; /* Empêche le bouton de rétrécir */
  }
  
  .waveform {
    flex-grow: 1;
    height: 40px; /* Adjust height */
    display: flex;
    align-items: center;
    gap: 2px;
    overflow: hidden;
    margin: 0 10px;
    min-width: 50px; /* Empêche la waveform de devenir trop petite */
  }
  
  .waveform .bar {
      background-color: #718096; /* Waveform bar color */
      width: 3px; /* Width of each bar */
      border-radius: 2px;
      display: inline-block; /* ou flex-shrink: 0 si parent est flex */
  }
  
  .duration {
    font-size: 13px;
    color: #a0aec0;
    margin: 0 10px;
    white-space: nowrap; /* Empêche la durée de passer à la ligne */
  }
  
  .volume-button {
      background: none;
      border: none;
      color: #a0aec0;
      font-size: 18px;
      cursor: pointer;
      flex-shrink: 0; /* Empêche le bouton de rétrécir */
  }
  
  
  
  .like-button {
    background: none;
    border: none;
    color: #cbd5e0; /* White/grey heart */
    font-size: 24px; /* Adjust size */
    cursor: pointer;
    padding: 5px; /* Easier clicking */
  }
  

  .comment-preview {
    margin-bottom: 15px;
    background-color: rgba(0, 0, 0, 0.1); /* Slightly transparent black bg */
    padding: 10px 15px;
    border-radius: 8px;
    margin-top: 20px;
  }
  
  
  
  .comment-text {
    font-size: 14px;
    color: #e2e8f0; /* Even lighter text */
    margin: 0;
    line-height: 1.4;
    word-wrap: break-word; /* Permet au texte long de passer à la ligne */
  }
  
  .comment-input-area {
    display: flex;
    align-items: center;
    background-color: #f2efef; /* Match audio player background */
    border-radius: 20px;
    border: 1px solid #ccc9c9;
    padding: 5px 5px 5px 15px; /* Adjust padding */
  }
  
  .comment-input {
    flex-grow: 1;
    background: none;
    border: none;
    outline: none;
    color: black;
    font-size: 14px;
    padding: 8px 0; /* Vertical padding */
    min-width: 0; /* Permet à l'input de rétrécir dans un flex container */
  }
  
  .comment-input::placeholder {
      color: #000;
      opacity: 0.8;
  }
  
  .mic-button {
    background: none;
    border: none;
    color: #6f6f6f; /* White/grey mic */
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    flex-shrink: 0; /* Empêche le bouton de rétrécir */
  }

  .action-icons-right {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 30px; /* Espace entre signalement et partage */
  }
  

  .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between; /* Pousse réactions à gauche, groupe actions à droite */
      margin-bottom: 15px;
      /* position: relative; N'est plus nécessaire pour le positionnement des icônes */
      min-height: 30px;
      padding: 0 5px; /* Léger padding latéral */
  }

  .report-button {
    color: red;
    font-size: 1.3em;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.2s ease;
    line-height: 1;
}

/* Dans <style scoped> de NoteCard.vue */
.report-error {
  background-color: rgba(255, 193, 7, 0.7); /* Exemple: Orange/Ambre translucide */
  color: #fff; /* Ou une couleur de texte qui contraste bien */
}


.share-button {
    color: black;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.2s ease;
    line-height: 1;
}

.share-button i {
    font-size: 1.3em;
}
.share-button:hover:not(:disabled) { background-color: rgba(113, 128, 150, 1); }

/* Style pour le conteneur des boutons de réaction */
.reaction-buttons {
    display: flex; 
    align-items: center; 
    gap: 10px;
}

/* Styles de base pour les icônes (optionnel mais recommandé) */
.like-button i {
  margin-right: 5px; 
  transition: color 0.2s ease-in-out;
}

/* Quand le bouton COEUR a la classe 'reacted', colorier son icône en rouge */
.like-button.heart-button i.fa-heart {
  color: #FF4136; /* Un rouge vif, ou choisissez votre nuance */
  /* Ou simplement : color: red; */
}

/* Quand le bouton POUCE a la classe 'reacted', colorier son icône en jaune/or */
.like-button.thumbs-up-button i.fa-thumbs-up {
  color: #FFDC00;
}

/* Optionnel : Si vous voulez aussi changer la couleur du compteur */
.like-button.reacted span.count {
   font-weight: bold;
}



.like-button {
  background-color: #000;
  border: 1px solid #000;
  color: white; /* Couleur du texte/compteur par défaut */
  padding: 5px 10px;
  border-radius: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: inline-flex; /* Pour aligner icône et compteur */
  align-items: center; /* Centrer verticalement icône et compteur */
}


.like-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

  
.status-message { /* Style pour message de chargement */
    color: #555;
    font-size: 0.8em;
    margin-top: 5px;
    text-align: center;
    width: 100%;
}
.status-message i { margin-right: 5px; }

/* Conteneur principal de la nouvelle section (remplace .comments-list-section si besoin) */
.comments-display-section {
    margin-top: 15px; /* Espace au-dessus */
    padding-top: 15px;
    border-top: 1px solid #8a8989; /* Ligne de séparation légère */
    background-color: #f9f8f8;
    padding-left: 10px;
}

/* Conteneur pour les 2 commentaires affichés par défaut */
.default-comments-list {
    margin-bottom: 8px; /* Espace avant le bouton "Voir plus" */
}

/* Style de base pour un item commentaire (peut légèrement modifier l'existant si besoin) */
/* Assurez-vous que ces styles de base sont présents et corrects */
.comment-item {
    font-size: 1.2em;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0); /* Séparateur très léger */
    line-height: 1.4;
    color: #555555; /* Couleur principale du texte du commentaire */
}
.comment-item:last-child {
    border-bottom: none; /* Pas de bordure pour le dernier */
    margin-bottom: 0;
}
/* Style pour le contenu texte (vérifiez s'il existe déjà) */
.comment-content {
    margin: 0;
    word-wrap: break-word; /* Assure le retour à la ligne */
}
/* Style pour le nom du commentateur (peut modifier l'existant) */
.commenter-name {
    color: #555555; /* Gris clair pour le nom */
    margin-right: 5px;
    font-weight: bold;
    font-size: 1.1em;
    display: inline; /* Assurez-vous qu'il est inline ou inline-block */
}
/* Style pour le placeholder (vérifiez s'il existe déjà) */
.comment-preview.placeholder p {
    color: #a0aec0; /* Gris moyen */
    font-style: italic;
    font-size: 0.9em;
    margin: 5px 0 0 0;
}

/* NOUVEAU: Style pour le bouton "Voir tous les X commentaires" */
.show-all-comments-button {
    background: none;
    border: none;
    color: #2b58d4; /* Bleu clair pour le lien */
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    padding: 5px 0;
    margin-top: 5px;
    display: inline-flex; /* Pour aligner texte et icône */
    align-items: center;
    gap: 5px; /* Espace entre texte et icône */
}
.show-all-comments-button:hover {
    text-decoration: underline;
}
.show-all-comments-button i { /* Style pour l'icône chevron */
    font-size: 0.9em;
}


/* --- NOUVEAU: Styles pour le Popover --- */

/* Fond semi-transparent qui couvre toute la page */
.comments-popover-overlay {
    position: fixed; /* Reste en place même si on scrolle la page derrière */
    inset: 0; /* Raccourci pour top: 0; left: 0; right: 0; bottom: 0; */
    background-color: rgba(10, 10, 20, 0.7); /* Fond très sombre et translucide */
    backdrop-filter: blur(3px); /* Floute légèrement l'arrière-plan */
    display: flex; /* Utilise flexbox pour centrer le contenu */
    justify-content: center; /* Centre horizontalement */
    align-items: center; /* Centre verticalement */
    z-index: 1000; /* Assure que le popover est au-dessus de tout le reste */
    padding: 20px; /* Marge intérieure pour éviter que le contenu touche les bords */
    box-sizing: border-box; /* Inclut le padding dans la taille totale */
}

/* La boîte qui contient le contenu du popover */
.comments-popover-content {
    background-color: #2d3748; /* Fond sombre (gris-bleu) pour le contenu */
    color: #e2e8f0; /* Texte clair par défaut dans le popover */
    border-radius: 12px; /* Coins plus arrondis */
    box-shadow: 0 8px 25px rgba(0,0,0,0.5); /* Ombre plus prononcée */
    padding: 25px; /* Plus d'espace intérieur */
    max-width: 550px; /* Largeur maximale */
    width: 95%; /* Prend presque toute la largeur sur petit écran */
    max-height: 85vh; /* Hauteur max pour éviter de couvrir toute la page */
    display: flex; /* Utilise flexbox pour organiser header/body */
    flex-direction: column; /* Header en haut, body en bas */
    border: 1px solid #4a5568; /* Bordure subtile */
}

/* En-tête du popover (Titre + bouton fermer) */
.popover-header {
    display: flex;
    justify-content: space-between; /* Titre à gauche, bouton à droite */
    align-items: center; /* Centrer verticalement */
    border-bottom: 1px solid #4a5568; /* Ligne de séparation */
    padding-bottom: 15px;
    margin-bottom: 15px;
    flex-shrink: 0; /* Empêche le header de rétrécir */
}
.popover-header h3 {
    margin: 0;
    font-size: 1.3em; /* Titre plus grand */
    color: #e2e8f0;
    font-weight: 600; /* Un peu plus gras */
}

/* Bouton pour fermer le popover (la croix) */
.close-popover-button {
    background: rgba(255, 255, 255, 0.1); /* Fond léger */
    border: none;
    border-radius: 50%; /* Rond */
    width: 30px;
    height: 30px;
    font-size: 1.1em;
    color: #a0aec0; /* Couleur de l'icône */
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease, color 0.2s ease;
}
.close-popover-button:hover {
    background-color: rgba(255, 255, 255, 0.2); /* Plus clair au survol */
    color: #e2e8f0; /* Icône plus claire au survol */
}

/* Corps du popover (contiendra la liste scrollable) */
.popover-body {
    overflow-y: auto; /* Ajoute une scrollbar verticale si nécessaire */
    flex-grow: 1; /* Prend tout l'espace vertical restant */
    padding-right: 5px; /* Petit espace à droite pour la scrollbar */
     /* Style optionnel pour la scrollbar (marche sur navigateurs Webkit/Blink) */
     scrollbar-width: thin; /* Pour Firefox */
     scrollbar-color: #718096 #4a5568; /* Pouce et Piste pour Firefox */
}
/* Styles pour navigateurs Webkit (Chrome, Safari, Edge) */
.popover-body::-webkit-scrollbar { width: 6px; }
.popover-body::-webkit-scrollbar-track { background: #4a5568; border-radius: 3px; }
.popover-body::-webkit-scrollbar-thumb { background-color: #718096; border-radius: 3px; }
.popover-body::-webkit-scrollbar-thumb:hover { background-color: #a0aec0; }

/* Style spécifique pour un item commentaire DANS le popover */
.popover-comment-item {
    padding: 12px 0; /* Plus d'espacement vertical dans le popover */
    border-bottom: 1px solid #4a5568; /* Séparateur un peu plus visible */
    /* Hérite des autres styles de .comment-item */
}
.popover-comment-item .commenter-name {
    color: #90cdf4; /* Couleur différente pour le nom dans le popover */
    /* Hérite du font-weight de .commenter-name */
}
.popover-comment-item:last-child {
    border-bottom: none; /* Pas de bordure pour le dernier */
}


</style>