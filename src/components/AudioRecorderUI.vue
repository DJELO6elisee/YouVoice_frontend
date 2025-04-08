<script setup>
import { ref, computed, onUnmounted } from 'vue';

// --- État Principal ---
const mode = ref('idle'); // idle, recording, recorded, playing, paused, sending, error
const errorMessage = ref(''); // Message d'erreur pour l'utilisateur

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
    // Affiche progression/durée si lecture/pause, sinon durée totale
    const timeToShow = (isPlaying.value || isPaused.value) ? playbackTime.value : recordingDuration.value;
    return `${formatTime(timeToShow)} / ${formatTime(recordingDuration.value)}`;
  }
  return '00:00'; // Temps par défaut
});

// Démarre le timer visuel pendant l'enregistrement
const startTimer = () => {
  stopTimer(); // Assure qu'il n'y a pas de timer existant
  console.log("[TIMER] Starting timer");
  elapsedTime.value = 0; // Réinitialise le temps écoulé
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
    // Revenir à l'état 'recorded' si une erreur survient pendant lecture/pause
    if (mode.value === 'playing' || mode.value === 'paused') {
        mode.value = 'recorded';
    }
};

// --- Fonction de Nettoyage Centralisée ---
// Essentiel pour libérer les ressources et éviter les problèmes
const resetRecorder = (newState = 'idle') => {
  console.log(`[RESET] Resetting recorder state. Target state: ${newState}`);
  stopTimer(); // Arrêter le timer s'il tourne

  // 1. Nettoyer le lecteur audio
  if (audioPlayer.value) {
    console.log("[RESET] Cleaning up audio player...");
    audioPlayer.value.pause();
    audioPlayer.value.removeEventListener('timeupdate', updatePlaybackTime);
    audioPlayer.value.removeEventListener('ended', handlePlaybackEnd);
    audioPlayer.value.removeEventListener('error', handleAudioError);
    audioPlayer.value.src = ''; // Très important pour libérer
    audioPlayer.value = null;
    console.log("[RESET] Audio player cleaned up.");
  }

  // 2. Nettoyer l'URL Blob
  if (audioUrl.value) {
    console.log("[RESET] Revoking Object URL:", audioUrl.value);
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
  }

  // 3. Arrêter le MediaRecorder (s'il existe et est actif)
  if (recorder.value && recorder.value.state !== 'inactive') {
      console.log(`[RESET] Stopping MediaRecorder (state: ${recorder.value.state})`);
      // Retirer les listeners avant d'arrêter pourrait être plus sûr dans certains cas
      recorder.value.ondataavailable = null;
      recorder.value.onstop = null;
      recorder.value.onerror = null;
      // Ne pas appeler stop() s'il est déjà inactive pour éviter des erreurs
      // recorder.value.stop(); // stop() est asynchrone et on est déjà en train de reset
      recorder.value = null;
  }

  // 4. Arrêter les pistes du stream (micro)
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
  // Ne pas réinitialiser errorMessage ici pour pouvoir l'afficher si le reset vient d'une erreur

  // 6. Définir le nouvel état
  mode.value = newState;
  console.log(`[RESET] Recorder state reset complete. Mode is now: ${mode.value}`);
};


// --- Logique d'Enregistrement ---
const startRecording = async () => {
  console.log("[START] Attempting to start recording...");
  // Réinitialiser complètement avant de commencer, sauf le message d'erreur
  const previousError = errorMessage.value; // Garder l'erreur précédente si besoin
  resetRecorder('idle'); // Assure un état propre, passe en idle
  errorMessage.value = previousError; // Restaurer l'erreur si utile

  // Demander accès micro (nécessite HTTPS ou localhost)
  try {
    console.log("[START] Requesting microphone access (getUserMedia)...");
    stream.value = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("[START] Microphone access granted.");

    // Configurer MediaRecorder
    const options = { mimeType: 'audio/webm;codecs=opus' }; // Préférer webm/opus si possible
    try {
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn(`[START] MimeType ${options.mimeType} not supported. Trying default.`);
            delete options.mimeType; // Utiliser le défaut navigateur
        }
    } catch (e) { console.warn("[START] Error checking mimeType support", e); delete options.mimeType; }

    console.log("[START] Creating MediaRecorder with options:", options);
    recorder.value = new MediaRecorder(stream.value, options);
    console.log("[START] MediaRecorder instance created:", recorder.value);
    audioChunks.value = []; // S'assurer que les chunks sont vides

    // Attacher les gestionnaires d'événements AVANT start()
    recorder.value.ondataavailable = (event) => {
      // Se déclenche périodiquement grâce au timeslice ou à la fin
      console.log(`[EVENT] ondataavailable fired. Data size: ${event.data.size}`);
      if (event.data.size > 0) {
        audioChunks.value.push(event.data);
        console.log(`[EVENT] Pushed chunk. Total chunks now: ${audioChunks.value.length}`);
      } else {
        console.log("[EVENT] ondataavailable fired with empty data chunk.");
      }
    };

    recorder.value.onstop = () => {
      console.log("[EVENT] onstop fired. Processing recorded data...");
      // Vérifier si des chunks ont été collectés
      if (audioChunks.value.length === 0) {
          console.error("[EVENT] onstop: No audio chunks recorded. Resetting.");
          errorMessage.value = "Échec: Aucune donnée audio capturée.";
          resetRecorder('error'); // Reset vers un état d'erreur
          return; // Ne pas continuer
      }

      // Créer le Blob final
      const mimeType = recorder.value?.mimeType || 'audio/webm'; // Utiliser le type réel si possible
      console.log(`[EVENT] onstop: Creating Blob (type: ${mimeType}, chunks: ${audioChunks.value.length})`);
      try {
          recordedBlob.value = new Blob(audioChunks.value, { type: mimeType });
          console.log("[EVENT] onstop: Blob created successfully:", recordedBlob.value);

          // Créer l'URL objet pour la lecture locale
          audioUrl.value = URL.createObjectURL(recordedBlob.value);
          console.log("[EVENT] onstop: Created Object URL:", audioUrl.value);

          // Nettoyer les chunks (maintenant dans le blob)
          audioChunks.value = [];

          // Sauvegarder la durée finale
          recordingDuration.value = elapsedTime.value; // Utiliser le temps du timer
          console.log(`[EVENT] onstop: Final duration set to ${recordingDuration.value}s`);

          // Passer à l'état 'recorded'
          mode.value = 'recorded';
          console.log("[EVENT] onstop: Mode set to 'recorded'. Recording complete.");

      } catch (blobError) {
           console.error("[EVENT] onstop: Error creating Blob:", blobError);
           errorMessage.value = "Erreur lors de la finalisation de l'audio.";
           resetRecorder('error');
      }
    };

    recorder.value.onerror = (event) => {
      console.error("[EVENT] onerror fired:", event.error);
      errorMessage.value = `Erreur d'enregistrement: ${event.error.name}`;
      resetRecorder('error'); // Reset complet en cas d'erreur recorder
    };

    // Démarrer l'enregistrement avec un timeslice (ex: 1 sec)
    const timeSliceMs = 1000;
    console.log(`[START] Calling recorder.start(${timeSliceMs})...`);
    recorder.value.start(timeSliceMs); // Force ondataavailable périodique
    console.log("[START] Recording should have started. Recorder state:", recorder.value?.state);

    // Démarrer le timer visuel et mettre à jour l'état
    startTimer();
    mode.value = 'recording';
    errorMessage.value = ''; // Effacer les anciens messages d'erreur
    console.log("[START] Mode set to 'recording'");

  } catch (err) {
    // Gérer les erreurs potentielles de getUserMedia
    console.error("[START] FAILED. Error during startRecording:", err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         errorMessage.value = "Microphone refusé. Vérifiez les permissions.";
     } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
         errorMessage.value = "Aucun microphone trouvé.";
     } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
         errorMessage.value = "Erreur matérielle du microphone.";
     } else {
        errorMessage.value = `Erreur démarrage: ${err.name}`;
     }
    resetRecorder('error'); // Assurer un reset même si erreur getUserMedia
  }
};

// Arrête l'enregistrement en cours
const stopRecording = () => {
  console.log("[STOP] Attempting to stop recording...");
  if (recorder.value && recorder.value.state === 'recording') {
    console.log("[STOP] Recorder exists and is recording. Calling recorder.stop()...");
    // Arrêter le timer immédiatement pour figer la durée visuelle
    stopTimer();
    // stop() déclenchera 'ondataavailable' (une dernière fois) puis 'onstop'
    recorder.value.stop();
    console.log("[STOP] recorder.stop() called. Waiting for 'onstop' event.");
    // Le passage à l'état 'recorded' se fera dans 'onstop'
  } else {
    console.warn("[STOP] Stop called but recorder not found or not in 'recording' state. Current state:", recorder.value?.state);
  }
};


// --- Logique de Lecture ---

// Met à jour le temps affiché pendant la lecture
const updatePlaybackTime = () => {
    if (audioPlayer.value) {
        playbackTime.value = audioPlayer.value.currentTime;
    }
};

// Gère la fin de la lecture
const handlePlaybackEnd = () => {
    console.log("[PLAYBACK] Playback ended.");
    playbackTime.value = 0; // Réinitialiser le temps affiché
    mode.value = 'recorded'; // Revenir à l'état "prêt à jouer"
};

// Démarre la lecture de l'audio enregistré
const playAudio = () => {
  console.log("[PLAYBACK] playAudio called. Current mode:", mode.value, "Audio URL:", audioUrl.value);
  if (!audioUrl.value) { console.error("[PLAYBACK] Cannot play: audioUrl is null."); return; }
  if (mode.value === 'playing') { console.warn("[PLAYBACK] Already playing."); return; } // Eviter double appel

  // Créer le lecteur s'il n'existe pas
  if (!audioPlayer.value) {
    console.log("[PLAYBACK] Creating new Audio element for URL:", audioUrl.value);
    try {
        audioPlayer.value = new Audio(audioUrl.value);
        audioPlayer.value.addEventListener('timeupdate', updatePlaybackTime);
        audioPlayer.value.addEventListener('ended', handlePlaybackEnd);
        audioPlayer.value.addEventListener('error', handleAudioError);
        console.log("[PLAYBACK] Audio element created and listeners attached.");
    } catch (error) { console.error("[PLAYBACK] Error creating Audio element:", error); errorMessage.value = "Impossible de créer lecteur."; return; }
  }

  // Démarrer la lecture (gère la promesse)
  console.log("[PLAYBACK] Calling audioPlayer.play()...");
  const playPromise = audioPlayer.value.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
        console.log("[PLAYBACK] Playback started successfully.");
        mode.value = 'playing'; // Mettre à jour le mode APRES succès
        errorMessage.value = ''; // Effacer erreur précédente
    }).catch(error => {
        console.error("[PLAYBACK] Error starting playback:", error);
        errorMessage.value = `Erreur lecture: ${error.message}.`;
        if(mode.value === 'playing') mode.value = 'recorded'; // Revenir à recorded
    });
  } else { mode.value = 'playing'; } // Pour anciens navigateurs
};

// Met en pause la lecture
const pauseAudio = () => {
    console.log("[PLAYBACK] pauseAudio called.");
    if (audioPlayer.value && mode.value === 'playing') { // Vérifier explicitement le mode
        audioPlayer.value.pause();
        mode.value = 'paused';
        console.log("[PLAYBACK] Playback paused. Mode set to 'paused'.");
    } else { console.warn("[PLAYBACK] pauseAudio called but not playing or no player."); }
};


// --- Gestionnaires d'Actions des Boutons ---

// Bouton principal (Microphone / Stop / Pause Lecture)
const handlePrimaryAction = () => {
  console.log(`[ACTION] Primary button clicked. Current mode: ${mode.value}`);
  // Si inactif ou enregistrement terminé/en pause => Démarrer enregistrement
  if (isIdle.value || isRecorded.value || isPaused.value) {
    console.log("[ACTION] -> Decided to START recording.");
    startRecording();
  }
  // Si en train d'enregistrer => Arrêter enregistrement
  else if (isRecording.value) {
    console.log("[ACTION] -> Decided to STOP recording.");
    stopRecording();
  }
  // Si en train de lire => Mettre en pause la lecture
  else if (isPlaying.value) {
    console.log("[ACTION] -> Decided to PAUSE playback (via primary button).");
     pauseAudio();
  } else { console.warn("[ACTION] Primary button clicked in unexpected mode:", mode.value); }
};

// Bouton Play/Pause dédié
const handlePlayPause = () => {
    console.log("[ACTION] Play/Pause button clicked. Current mode:", mode.value);
    if (isPlaying.value) {
        console.log("[ACTION] -> Calling pauseAudio()");
        pauseAudio();
    } else if (isRecorded.value || isPaused.value) { // Peut jouer depuis recorded ou paused
        console.log("[ACTION] -> Calling playAudio()");
        playAudio();
    } else { console.warn("[ACTION] Play/Pause button clicked in unexpected mode:", mode.value); }
};

// Bouton Supprimer
const handleDelete = () => {
    console.log("[ACTION] Delete button clicked.");
    // On peut supprimer si un enregistrement existe, même s'il est en lecture/pause
    if (hasRecording.value || isPlaying.value || isPaused.value) {
        console.log("[ACTION] -> Calling resetRecorder() to delete recording.");
        errorMessage.value = ''; // Effacer les erreurs avant de supprimer
        resetRecorder('idle'); // Reset complet vers l'état initial
    } else { console.warn("[ACTION] Delete button clicked but nothing to delete (no recording)."); }
};

// Bouton Envoyer
const sendAudio = async () => {
    console.log("[ACTION] Send button clicked.");
    if (!recordedBlob.value) { console.error("[SEND] Cannot send: No recorded blob available."); return; }
    if (mode.value === 'sending') { console.warn("[SEND] Already sending."); return; } // Eviter double envoi

    console.log("--- Preparing to Send Audio ---");
    mode.value = 'sending'; errorMessage.value = '';
    const authToken = localStorage.getItem('authToken');
    console.log("[SEND] Auth Token found:", !!authToken);
    if (!authToken) { errorMessage.value = "Non connecté."; mode.value = 'recorded'; return; }

    const formData = new FormData();
    const filenameUserId = localStorage.getItem('userId') || 'unknown';
    const filename = `voicenote_${filenameUserId}_${Date.now()}.webm`;
    formData.append('audio', recordedBlob.value, filename); // Clé 'audio'
    formData.append('duration', recordingDuration.value.toString()); // Clé 'duration'

    console.log(`[SEND] Sending: filename=${filename}, duration=${recordingDuration.value}s, size=${recordedBlob.value.size}bytes`);
    console.log("[SEND] FormData content:", Object.fromEntries(formData.entries())); // Visualiser FormData

    try {
      const response = await fetch('http://localhost:5000/api/voice-notes', { // !! Vérifie cette URL !!
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData,
      });
      console.log("[SEND] Fetch Response Status:", response.status, response.statusText);

      if (!response.ok) {
         let errorMsg = `Erreur: ${response.status}`;
         try { const errorData = await response.json(); errorMsg = `Erreur: ${errorData.message || response.statusText}`; }
         catch (e) { errorMsg = `Erreur ${response.status}: ${response.statusText}`; }
         throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('[SEND] Server Success Response:', result);
      console.log('[SEND] Audio sent successfully! Resetting.');
      resetRecorder('idle'); // Reset vers idle après succès

    } catch (error) {
      console.error('[SEND] FAILED:', error);
      errorMessage.value = `Échec envoi: ${error.message}`;
      mode.value = 'recorded'; // Revenir à 'recorded' pour permettre une nouvelle tentative
    }
};


// --- Nettoyage au Démontage ---
onUnmounted(() => {
    console.log("[LIFECYCLE] Component unmounted. Running final cleanup.");
    resetRecorder(); // Assurer le nettoyage complet quand le composant disparaît
});

</script>

<template>
  <div class="voice-recorder">
    <!-- Bouton Principal Enregistrer/Stop/Pause Lecture -->
    <button
        class="record-button"
        @click="handlePrimaryAction"
        :disabled="isSending"
        :class="{ 'is-recording': isRecording }"
        :title="isIdle ? 'Enregistrer' : (isRecording ? 'Arrêter' : (isPlaying ? 'Pause Lecture' : (isPaused ? 'Enregistrer Nv.' : 'Enregistrer Nv.')))"
    >
        <!-- Icône Microphone si idle, recorded, paused -->
        <span v-if="isIdle || isRecorded || isPaused"><i class="fa-solid fa-microphone"></i></span>
        <!-- Icône Stop si recording -->
        <span v-else-if="isRecording"><i class="fa-solid fa-stop"></i></span>
        <!-- Icône Pause si playing -->
        <span v-else-if="isPlaying"><i class="fa-solid fa-pause"></i></span>
        <!-- Fallback (ne devrait pas arriver) -->
         <span v-else><i class="fa-solid fa-question"></i></span>
    </button>

    <!-- Affichage Temps -->
    <div class="timer" :class="{ 'recording-timer': isRecording }">
      {{ displayTime }}
    </div>

    <!-- Messages Statut/Erreur -->
    <div v-if="isSending" class="status-message">Envoi en cours... <i class="fa-solid fa-spinner fa-spin"></i></div>
    <div v-if="errorMessage" class="error-message"><i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage }}</div>

    <!-- Contrôles Post-Enregistrement -->
    <!-- Affichés seulement si un enregistrement existe (recorded, playing, paused) -->
    <div class="controls" v-if="hasRecording || isPlaying || isPaused">
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
</template>

<style scoped>
.voice-recorder { background-color: #a9c0de; padding: 40px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 500px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative; min-height: 250px; margin: auto;}
.record-button { background-color: #ffffff; border: 6px solid #6f42c1; width: 100px; height: 100px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 3em; color: #6f42c1; cursor: pointer; margin-bottom: 20px; transition: transform 0.2s ease, background-color 0.3s, border-color 0.3s; }
.record-button:hover:not(:disabled) { transform: scale(1.05); }
.record-button:active:not(:disabled) { transform: scale(0.95); }
.record-button:disabled { opacity: 0.6; cursor: not-allowed; }
.record-button.is-recording { background-color: #dc3545; border-color: #a71d2a; color: white; }
.record-button.is-recording span { animation: pulse 1.5s infinite ease-in-out; }
@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
.timer { font-size: 1.2em; color: #333; margin-bottom: 10px; font-family: 'Courier New', Courier, monospace; min-height: 20px; }
.timer.recording-timer { color: #dc3545; font-weight: bold; }
.status-message, .error-message { min-height: 18px; margin-bottom: 15px; font-size: 0.9em; text-align: center; width: 100%; /* Prend toute la largeur */}
.status-message { color: #007bff; }
.error-message { color: #dc3545; font-weight: bold; }
.error-message i { margin-right: 5px; } /* Espace icône erreur */
.status-message i { margin-left: 8px; } /* Espace icône spinner */
.controls { display: flex; gap: 25px; align-items: center; margin-top: 15px; }
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