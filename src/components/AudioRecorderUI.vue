<script setup>
  import { ref, computed, onUnmounted } from 'vue';

  // --- État Principal ---
  const mode = ref('idle'); // idle, recording, recorded, playing, paused, sending, error
  const errorMessage = ref(''); // Message d'erreur pour l'utilisateur

  // --- Description ---
  const description = ref(''); // <<--- NOUVEAU: Variable pour la description

  // --- Ressources Média ---
  const stream = ref(null); // MediaStream (microphone)
  const recorder = ref(null); // MediaRecorder instance
  const audioChunks = ref([]); // Morceaux audio bruts
  const recordedBlob = ref(null); // Blob audio final
  const audioUrl = ref(null); // URL locale pour la lecture (Blob URL)
  const audioPlayer = ref(null); // Élément HTMLAudioElement pour la lecture

  // --- Timers & Durée ---
  const elapsedTime = ref(0); // Temps écoulé pendant l'enregistrement
  const playbackTime = ref(0); // Temps actuel pendant la lecture
  const recordingDuration = ref(0); // Durée finale de l'enregistrement
  const timerInterval = ref(null); // ID de l'intervalle pour le timer

  // --- Propriétés Calculées (pour la clarté du template) ---
  const isIdle = computed(() => mode.value === 'idle');
  const isRecording = computed(() => mode.value === 'recording');
  const isRecorded = computed(() => mode.value === 'recorded');
  const isPlaying = computed(() => mode.value === 'playing');
  const isPaused = computed(() => mode.value === 'paused');
  const isSending = computed(() => mode.value === 'sending');
  const hasRecording = computed(() => !!recordedBlob.value); // Vrai s'il y a un blob enregistré

  // --- Fonctions Utilitaires ---

  // Formate les secondes en MM:SS
  const formatTime = (seconds) => {
    const totalSeconds = Math.round(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Affiche le temps pertinent selon l'état
  const displayTime = computed(() => {
    if (isRecording.value) { return formatTime(elapsedTime.value); }
    if (hasRecording.value || isPlaying.value || isPaused.value) {
      const timeToShow = (isPlaying.value || isPaused.value) ? playbackTime.value : recordingDuration.value;
      return `${formatTime(timeToShow)} / ${formatTime(recordingDuration.value)}`;
    }
    return '00:00';
  });

  // Démarre le timer visuel
  const startTimer = () => {
    stopTimer();
    console.log("[TIMER] Starting timer");
    elapsedTime.value = 0;
    timerInterval.value = setInterval(() => { elapsedTime.value += 1; }, 1000);
  };

  // Arrête le timer visuel
  const stopTimer = () => {
    if (timerInterval.value) {
      console.log("[TIMER] Stopping timer");
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  // Gestionnaire générique pour les erreurs de lecture audio
  const handleAudioError = (e) => {
      console.error("[PLAYBACK] Audio player error event:", e);
      const error = e.target?.error;
      errorMessage.value = `Erreur de lecture: ${error?.message || 'Inconnue'}`;
      if (mode.value === 'playing' || mode.value === 'paused') {
          mode.value = 'recorded';
      }
  };

  // --- Fonction de Nettoyage Centralisée ---
  const resetRecorder = (newState = 'idle') => {
    console.log(`[RESET] Resetting recorder state. Target state: ${newState}`);
    stopTimer();

    // 1. Nettoyer le lecteur audio
    if (audioPlayer.value) {
      console.log("[RESET] Cleaning up audio player...");
      audioPlayer.value.pause();
      audioPlayer.value.removeEventListener('timeupdate', updatePlaybackTime);
      audioPlayer.value.removeEventListener('ended', handlePlaybackEnd);
      audioPlayer.value.removeEventListener('error', handleAudioError);
      audioPlayer.value.src = '';
      audioPlayer.value = null;
      console.log("[RESET] Audio player cleaned up.");
    }

    // 2. Nettoyer l'URL Blob
    if (audioUrl.value) {
      console.log("[RESET] Revoking Object URL:", audioUrl.value);
      URL.revokeObjectURL(audioUrl.value);
      audioUrl.value = null;
    }

    // 3. Arrêter le MediaRecorder
    if (recorder.value && recorder.value.state !== 'inactive') {
        console.log(`[RESET] Stopping MediaRecorder (state: ${recorder.value.state})`);
        // Ne pas réattacher les listeners ici, ils sont déjà retirés implicitement par l'arrêt ou le reset
        try {
            if (recorder.value.state === 'recording') {
                recorder.value.stop(); // Peut lancer une erreur si on stop() trop tôt
            }
        } catch(e) { console.warn("[RESET] Minor error stopping recorder, likely already stopped:", e.message)}
        recorder.value = null;
    }

    // 4. Arrêter les pistes du stream
    if (stream.value) {
      console.log("[RESET] Stopping media stream tracks...");
      stream.value.getTracks().forEach(track => track.stop());
      stream.value = null;
      console.log("[RESET] Media stream tracks stopped.");
    }

    // 5. Réinitialiser les variables d'état
    audioChunks.value = [];
    recordedBlob.value = null;
    elapsedTime.value = 0;
    playbackTime.value = 0;
    recordingDuration.value = 0;
    description.value = ''; // <<--- NOUVEAU: Réinitialiser la description

    // 6. Définir le nouvel état
    mode.value = newState;
    console.log(`[RESET] Recorder state reset complete. Mode is now: ${mode.value}`);
  };


  // --- Logique d'Enregistrement ---
  const startRecording = async () => {
    console.log("[START] Attempting to start recording...");
    const previousError = errorMessage.value;
    resetRecorder('idle');
    errorMessage.value = previousError;

    try {
      console.log("[START] Requesting microphone access...");
      stream.value = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[START] Microphone access granted.");

      const options = { mimeType: 'audio/webm;codecs=opus' };
      try {
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              console.warn(`[START] MimeType ${options.mimeType} not supported. Trying default.`);
              delete options.mimeType;
          }
      } catch (e) { console.warn("[START] Error checking mimeType support", e); delete options.mimeType; }

      console.log("[START] Creating MediaRecorder with options:", options);
      recorder.value = new MediaRecorder(stream.value, options);
      audioChunks.value = [];

      recorder.value.ondataavailable = (event) => {
        console.log(`[EVENT] ondataavailable fired. Data size: ${event.data.size}`);
        if (event.data.size > 0) {
          audioChunks.value.push(event.data);
        } else { console.log("[EVENT] ondataavailable fired with empty data chunk."); }
      };

      recorder.value.onstop = () => {
        console.log("[EVENT] onstop fired. Processing recorded data...");
        if (audioChunks.value.length === 0) {
            console.error("[EVENT] onstop: No audio chunks recorded.");
            errorMessage.value = "Échec: Aucune donnée audio capturée.";
            resetRecorder('error');
            return;
        }
        const mimeType = recorder.value?.mimeType || 'audio/webm';
        console.log(`[EVENT] onstop: Creating Blob (type: ${mimeType}, chunks: ${audioChunks.value.length})`);
        try {
            recordedBlob.value = new Blob(audioChunks.value, { type: mimeType });
            audioUrl.value = URL.createObjectURL(recordedBlob.value);
            audioChunks.value = [];
            recordingDuration.value = elapsedTime.value;
            console.log(`[EVENT] onstop: Blob created, URL generated, duration ${recordingDuration.value}s. Mode -> recorded.`);
            mode.value = 'recorded';
        } catch (blobError) {
            console.error("[EVENT] onstop: Error creating Blob:", blobError);
            errorMessage.value = "Erreur lors de la finalisation de l'audio.";
            resetRecorder('error');
        }
      };

      recorder.value.onerror = (event) => {
        console.error("[EVENT] onerror fired:", event.error);
        errorMessage.value = `Erreur d'enregistrement: ${event.error.name}`;
        resetRecorder('error');
      };

      const timeSliceMs = 1000;
      recorder.value.start(timeSliceMs);
      console.log("[START] Recording started. Recorder state:", recorder.value?.state);
      startTimer();
      mode.value = 'recording';
      errorMessage.value = '';

    } catch (err) {
      console.error("[START] FAILED. Error during startRecording:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') { errorMessage.value = "Microphone refusé."; }
      else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') { errorMessage.value = "Aucun microphone trouvé."; }
      else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') { errorMessage.value = "Erreur matérielle du microphone."; }
      else { errorMessage.value = `Erreur démarrage: ${err.name}`; }
      resetRecorder('error');
    }
  };

  // Arrête l'enregistrement
  const stopRecording = () => {
    console.log("[STOP] Attempting to stop recording...");
    if (recorder.value && recorder.value.state === 'recording') {
      stopTimer();
      recorder.value.stop();
      console.log("[STOP] recorder.stop() called.");
    } else { console.warn("[STOP] Stop called but recorder not found or not recording."); }
  };

  // --- Logique de Lecture ---
  const updatePlaybackTime = () => { if (audioPlayer.value) { playbackTime.value = audioPlayer.value.currentTime; } };
  const handlePlaybackEnd = () => { console.log("[PLAYBACK] Playback ended."); playbackTime.value = 0; mode.value = 'recorded'; };

  const playAudio = () => {
    console.log("[PLAYBACK] playAudio called.");
    if (!audioUrl.value) { console.error("[PLAYBACK] No audio URL."); return; }
    if (mode.value === 'playing') { console.warn("[PLAYBACK] Already playing."); return; }

    if (!audioPlayer.value) {
      console.log("[PLAYBACK] Creating new Audio element.");
      try {
          audioPlayer.value = new Audio(audioUrl.value);
          audioPlayer.value.addEventListener('timeupdate', updatePlaybackTime);
          audioPlayer.value.addEventListener('ended', handlePlaybackEnd);
          audioPlayer.value.addEventListener('error', handleAudioError);
      } catch (error) { console.error("[PLAYBACK] Error creating Audio:", error); errorMessage.value = "Impossible de créer lecteur."; return; }
    }

    const playPromise = audioPlayer.value.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
          console.log("[PLAYBACK] Playback started."); mode.value = 'playing'; errorMessage.value = '';
      }).catch(error => {
          console.error("[PLAYBACK] Playback error:", error); errorMessage.value = `Erreur lecture: ${error.message}.`; if(mode.value === 'playing') mode.value = 'recorded';
      });
    } else { mode.value = 'playing'; }
  };

  const pauseAudio = () => {
      console.log("[PLAYBACK] pauseAudio called.");
      if (audioPlayer.value && mode.value === 'playing') {
          audioPlayer.value.pause(); mode.value = 'paused';
      } else { console.warn("[PLAYBACK] Pause called but not playing or no player."); }
  };

  // --- Gestionnaires d'Actions des Boutons ---
  const handlePrimaryAction = () => {
    console.log(`[ACTION] Primary button. Mode: ${mode.value}`);
    if (isIdle.value || isRecorded.value || isPaused.value) { startRecording(); }
    else if (isRecording.value) { stopRecording(); }
    else if (isPlaying.value) { pauseAudio(); }
    else { console.warn("[ACTION] Primary button in unexpected mode:", mode.value); }
  };

  const handlePlayPause = () => {
      console.log("[ACTION] Play/Pause button. Mode:", mode.value);
      if (isPlaying.value) { pauseAudio(); }
      else if (isRecorded.value || isPaused.value) { playAudio(); }
      else { console.warn("[ACTION] Play/Pause in unexpected mode:", mode.value); }
  };

  const handleDelete = () => {
      console.log("[ACTION] Delete button.");
      if (hasRecording.value || isPlaying.value || isPaused.value) {
          errorMessage.value = ''; resetRecorder('idle');
      } else { console.warn("[ACTION] Delete clicked but nothing to delete."); }
  };

  // --- Envoi de l'audio ---
  const sendAudio = async () => {
      console.log("[ACTION] Send button clicked.");
      if (!recordedBlob.value) { console.error("[SEND] No recorded blob."); return; }
      if (mode.value === 'sending') { console.warn("[SEND] Already sending."); return; }

      console.log("--- Preparing to Send Audio ---");
      mode.value = 'sending'; errorMessage.value = '';
      const authToken = localStorage.getItem('authToken');
      if (!authToken) { errorMessage.value = "Non connecté."; mode.value = 'recorded'; return; }

      const formData = new FormData();
      const filenameUserId = localStorage.getItem('userId') || 'unknown';
      const filename = `voicenote_${filenameUserId}_${Date.now()}.webm`;
      formData.append('audio', recordedBlob.value, filename);
      formData.append('duration', recordingDuration.value.toString());
      formData.append('description', description.value); // <<--- NOUVEAU: Ajout de la description

      console.log(`[SEND] Sending: filename=${filename}, duration=${recordingDuration.value}s, description=${description.value || '(aucune)'}, size=${recordedBlob.value.size}bytes`);
      console.log("[SEND] FormData content:", Object.fromEntries(formData.entries())); // Visualiser FormData

      try {
        // !!! ADAPTEZ CETTE URL À VOTRE BACKEND !!!
        const response = await fetch('https://youvoiceapi-production.up.railway.app/api/voice-notes', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData,
        });
        console.log("[SEND] Response Status:", response.status, response.statusText);

        if (!response.ok) {
          let errorMsg = `Erreur: ${response.status}`;
          try { const errorData = await response.json(); errorMsg = `Erreur: ${errorData.message || response.statusText}`; }
          catch (e) { errorMsg = `Erreur ${response.status}: ${response.statusText}`; }
          throw new Error(errorMsg);
        }

        const result = await response.json();
        console.log('[SEND] Server Success:', result);
        console.log('[SEND] Audio sent successfully! Resetting.');
        resetRecorder('idle'); // Réinitialise après succès (efface aussi la description)

      } catch (error) {
        console.error('[SEND] FAILED:', error);
        errorMessage.value = `Échec envoi: ${error.message}`;
        mode.value = 'recorded'; // Revenir à 'recorded' pour nouvelle tentative
      }
  };

  // --- Nettoyage au Démontage ---
  onUnmounted(() => {
      console.log("[LIFECYCLE] Component unmounted. Final cleanup.");
      resetRecorder();
  });

</script>

<template>
  <div class="voice-recorder">
    <!-- Bouton Principal -->
    <button
        class="record-button"
        @click="handlePrimaryAction"
        :disabled="isSending"
        :class="{ 'is-recording': isRecording }"
        :title="isIdle ? 'Enregistrer' : (isRecording ? 'Arrêter' : (isPlaying ? 'Pause Lecture' : (isPaused ? 'Enregistrer Nv.' : 'Enregistrer Nv.')))"
    >
        <span v-if="isIdle || isRecorded || isPaused"><i class="fa-solid fa-microphone"></i></span>
        <span v-else-if="isRecording"><i class="fa-solid fa-stop"></i></span>
        <span v-else-if="isPlaying"><i class="fa-solid fa-pause"></i></span>
        <span v-else><i class="fa-solid fa-question"></i></span>
    </button>

    <!-- Affichage Temps -->
    <div class="timer" :class="{ 'recording-timer': isRecording }">
      {{ displayTime }}
    </div>

    <!-- Messages Statut/Erreur -->
    <div v-if="isSending" class="status-message">Envoi en cours... <i class="fa-solid fa-spinner fa-spin"></i></div>
    <div v-if="errorMessage" class="error-message"><i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage }}</div>

    <!-- Zone Description ET Contrôles Post-Enregistrement -->
    <!-- Affichés seulement si un enregistrement existe (recorded, playing, paused) -->
    <div class="post-recording-area" v-if="hasRecording || isPlaying || isPaused">

        <!-- Champ Description -->
        <div class="description-input-container">
            <label for="audioDescription" class="description-label">Description (optionnel) :</label>
            <textarea
                id="audioDescription"
                v-model="description"
                placeholder="Décrivez votre note vocale ici..."
                rows="3"
                class="description-textarea"
                :disabled="isSending"
            ></textarea>
        </div>

        <!-- Contrôles (boutons) -->
        <div class="controls">
          <!-- Bouton Supprimer -->
          <button
            class="control-button delete-button"
            @click="handleDelete"
            :disabled="isSending"
            title="Supprimer"
          >
            <i class="fa-solid fa-trash"></i>
          </button>

          <!-- Bouton Play/Pause -->
          <button
            class="control-button play-pause-button"
            @click="handlePlayPause"
            :disabled="isSending"
            :title="isPlaying ? 'Pause' : 'Écouter'"
          >
            <span v-if="isPlaying"><i class="fa-solid fa-pause"></i></span>
            <span v-else><i class="fa-solid fa-play"></i></span>
          </button>

          <!-- Bouton Envoyer -->
          <button
            class="control-button send-button"
            @click="sendAudio"
            :disabled="isSending || !hasRecording"
            title="Envoyer"
          >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.voice-recorder { background-color: #a9c0de; padding: 40px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 500px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative; min-height: 250px; /* Ajustez si besoin */ margin: auto;}
.record-button { background-color: #ffffff; border: 6px solid #6f42c1; width: 100px; height: 100px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 3em; color: #6f42c1; cursor: pointer; margin-bottom: 20px; transition: transform 0.2s ease, background-color 0.3s, border-color 0.3s; }
.record-button:hover:not(:disabled) { transform: scale(1.05); }
.record-button:active:not(:disabled) { transform: scale(0.95); }
.record-button:disabled { opacity: 0.6; cursor: not-allowed; }
.record-button.is-recording { background-color: #dc3545; border-color: #a71d2a; color: white; }
.record-button.is-recording span { animation: pulse 1.5s infinite ease-in-out; }
@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
.timer { font-size: 1.2em; color: #333; margin-bottom: 10px; font-family: 'Courier New', Courier, monospace; min-height: 20px; }
.timer.recording-timer { color: #dc3545; font-weight: bold; }
.status-message, .error-message { min-height: 18px; margin-bottom: 15px; font-size: 0.9em; text-align: center; width: 90%; /* Prend quasi toute la largeur */ }
.status-message { color: #007bff; }
.error-message { color: #dc3545; font-weight: bold; }
.error-message i { margin-right: 5px; }
.status-message i { margin-left: 8px; }

/* <<--- NOUVEAU: Styles pour la zone post-enregistrement --- */
.post-recording-area {
  width: 100%; /* Prend toute la largeur disponible */
  display: flex;
  flex-direction: column; /* Description au-dessus des boutons */
  align-items: center; /* Centrer les éléments horizontalement */
  margin-top: 20px; /* Espace au-dessus */
  gap: 15px; /* Espace entre description et boutons */
}

/* <<--- NOUVEAU: Styles pour le conteneur de la description --- */
.description-input-container {
  width: 90%; /* Un peu moins large que le parent */
  display: flex;
  flex-direction: column; /* Label au-dessus du textarea */
}

/* <<--- NOUVEAU: Style pour le label --- */
.description-label {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 5px;
  text-align: left; /* Aligner le label à gauche */
  width: 100%; /* S'assurer qu'il prend la largeur */
}

/* <<--- NOUVEAU: Styles pour le textarea --- */
.description-textarea {
  width: 100%; /* S'adapter à son conteneur */
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 0.95em;
  font-family: inherit; /* Utiliser la police par défaut du reste */
  resize: vertical; /* Permettre redimensionnement vertical */
  min-height: 60px; /* Hauteur minimale */
  box-sizing: border-box; /* Inclure padding/border dans la largeur */
  transition: border-color 0.2s ease;
}
.description-textarea:focus {
    border-color: #6f42c1;
    outline: none;
}
.description-textarea:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

/* Styles pour les contrôles (légèrement ajustés si besoin) */
.controls {
    display: flex;
    gap: 25px; /* Conserve l'espacement entre les boutons */
    align-items: center;
    width: auto; /* La largeur sera déterminée par les boutons */
    justify-content: center; /* Centrer les boutons */
    flex-wrap: wrap; /* Permet aux boutons de passer à la ligne si manque de place */
}
.control-button { background-color: #ffffff; border: none; width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8em; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.3s; }
.control-button:hover:not(:disabled) { background-color: #f0f0f0; transform: translateY(-2px); }
.control-button:active:not(:disabled) { transform: translateY(0px) scale(0.95); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.control-button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
.delete-button { color: #6c757d; }
.delete-button:hover:not(:disabled) { background-color: #e0e0e0; }
.play-pause-button { color: #007bff; font-size: 1.8em; }
.play-pause-button i { line-height: 1; }
.play-pause-button:hover:not(:disabled) { background-color: #e0f0ff; }
.send-button { background-color: #28a745; color: white; }
.send-button:hover:not(:disabled) { background-color: #218838; }
.send-button:disabled { background-color: #28a745; opacity: 0.5; }

</style>