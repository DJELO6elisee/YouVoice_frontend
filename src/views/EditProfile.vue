<template>
  <div class="edit-profile-page">
      <!-- AJOUT: Indicateur de chargement et erreur -->
      <div v-if="isLoading" class="loading-indicator">Chargement des données...</div>
      <div v-if="!isLoading && error" class="error-message">{{ error }}</div>

      <!-- MODIFICATION: Afficher seulement si chargement ok et pas d'erreur -->
      <div class="edit-profile-card" v-if="!isLoading && !error">
          <!-- Banner and Header -->
          <div class="profile-banner">
              <div class="profile-summary">
                  <div class="user-info">
                      <!-- MODIFICATION: Utilise editableData pour l'avatar prévisualisé -->
                      <img :src="avatarPreviewUrl || 'https://via.placeholder.com/80?text=?'" alt="User Avatar" class="profile-avatar" />
                      <div class="user-details">
                          <!-- MODIFICATION: Utilise editableData pour l'affichage dynamique -->
                          <h2 class="user-name">{{ editableData.fullName || editableData.username || 'Utilisateur' }}</h2>
                          <p class="user-email">{{ editableData.email || 'Email inconnu' }}</p>
                      </div>
                  </div>
                  <button class="save-button" @click="goBackToProfile">Retour</button>


              </div>
          </div>

          <!-- Form Section -->
          <form class="profile-form" @submit.prevent="saveProfile">
              <div class="form-grid">
                  <!-- Username (Non modifiable généralement, mais on peut l'afficher) -->
                  <div class="form-group">
                      <label for="username">Username</label>
                      <input type="text" id="username" v-model="editableData.username" placeholder="Your Username" disabled />
                       <small>Le nom d'utilisateur ne peut pas être modifié.</small>
                  </div>

                  <!-- Full Name -->
                  <div class="form-group">
                      <label for="fullName">Full Name</label>
                      <!-- MODIFICATION: v-model pointe vers editableData -->
                      <input type="text" id="fullName" v-model="editableData.fullName" placeholder="Votre nom complet" />
                  </div>

                  <!-- Gender -->
                  <div class="form-group">
                      <label for="gender">Genre</label>
                      <div class="select-wrapper">
                          <!-- MODIFICATION: v-model pointe vers editableData -->
                          <select id="gender" v-model="editableData.genre">
                              <option disabled value="">Votre Genre</option>
                              <option value="homme">Homme</option>
                              <option value="femme">Femme</option>
                              <option value="autre">Autre</option>
                              <!-- Garder null pour 'Prefer not to say' si la DB accepte null -->
                              <option :value="null">Préfère ne pas dire</option>
                          </select>
                      </div>
                  </div>

                  <!-- Country -->
                  <div class="form-group">
                      <label for="country">Pays</label>
                       <div class="select-wrapper">
                          <!-- MODIFICATION: v-model pointe vers editableData -->
                          <select id="country" v-model="editableData.pays">
                              <option disabled value="">Votre Pays</option>
                              <!-- AJOUT: Liste plus complète et valeurs cohérentes -->
                              <option value="CI">Côte d'Ivoire</option>
                              <option value="FR">France</option>
                              <option value="CA">Canada</option>
                              <option value="US">United States</option>
                              <option value="BE">Belgique</option>
                              <option value="SN">Sénégal</option>
                              <!-- Ajouter d'autres pays pertinents -->
                              <option value="AUTRE">Autre</option>
                          </select>
                      </div>
                  </div>

                  <!-- Email -->
                  <div class="form-group">
                      <label for="email">Email</label>
                      <!-- MODIFICATION: v-model pointe vers editableData -->
                      <input type="email" id="email" v-model="editableData.email" placeholder="Votre Email" />
                  </div>

                  <!-- Bio -->
                  <div class="form-group form-group-bio">
                      <label for="bio">Bio</label>
                      <!-- MODIFICATION: v-model pointe vers editableData -->
                      <textarea id="bio" v-model="editableData.bio" placeholder="Votre Biographie"></textarea>
                  </div>

                   <!-- Avatar Upload -->
                  <div class="form-group form-group-avatar">
                     <label>Votre avatar</label>
                     <button type="button" class="upload-button" @click="triggerAvatarUpload">
                       + Changer/Ajouter une image
                     </button>
                     <input type="file" ref="avatarInput" @change="handleAvatarChange" accept="image/*" style="display: none;" />
                     <span v-if="avatarFileName" class="file-name">{{ avatarFileName }}</span>
                     <span v-else-if="originalAvatarUrl" class="file-name">Image actuelle conservée.</span>
                     <span v-else class="file-name">Aucune image sélectionnée.</span>
                  </div>
              </div>
               <!-- Bouton Sauvegarder en bas -->
               <div class="form-actions">
                  <button type="submit" class="save-button-bottom">Sauvegarder les modifications</button>
               </div>
          </form>
      </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
// Importer useRouter pour la redirection après sauvegarde ou en cas d'erreur grave
import { useRouter } from 'vue-router';

const router = useRouter();
const goBackToProfile = () => {
  router.push({ name: 'UserProfile' }); // ou router.push('/profile')
};
// --- AJOUT: State pour chargement et erreurs ---
const isLoading = ref(true);
const error = ref(null);

// --- AJOUT: Récupérer les URLs de base de l'environnement ---
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://youvoiceapi-production.up.railway.app/api';
const apiUrlBase = import.meta.env.VITE_API_URL_BASE || 'https://youvoiceapi-production.up.railway.app';

// --- MODIFICATION: Utiliser editableData comme source principale pour le formulaire ---
// Initialiser avec des valeurs null ou vides
const editableData = reactive({
  id: null, // Garder l'ID pour l'appel API de sauvegarde
  username: '', // Non modifiable, mais affiché
  fullName: '',
  genre: null, // Utiliser null pour correspondre à l'option 'Préfère ne pas dire' ou valeur initiale vide
  pays: '',
  email: '',
  bio: '',
  avatarFile: null, // Pour le nouveau fichier uploadé
});

// --- AJOUT: Stocker l'URL de l'avatar original et l'URL de prévisualisation ---
const originalAvatarUrl = ref(null); // URL de l'avatar venant de l'API
const avatarPreviewUrl = ref(null); // URL pour l'aperçu (Data URL si nouveau fichier)
const avatarInput = ref(null); // Ref pour l'input fichier caché
const avatarFileName = ref(''); // Nom du fichier sélectionné

// --- AJOUT: Fonction pour récupérer le token ---
const getToken = () => {
return localStorage.getItem('authToken');
};

// --- AJOUT: Fonction pour récupérer les données utilisateur ---
const fetchCurrentUserForEdit = async () => {
  isLoading.value = true;
  error.value = null;
  const token = getToken();

  if (!token) {
      error.value = "Non authentifié. Redirection vers la connexion...";
      setTimeout(() => router.push('/login'), 1500); // Laisser le temps de lire le message
      isLoading.value = false;
      return;
  }

  try {
      // Utilise la même route que Profile.vue
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
      });

      if (!response.ok) {
           const errorData = await response.json().catch(() => ({ message: 'Réponse non JSON' }));
           if (response.status === 401 || response.status === 403) {
               localStorage.removeItem('authToken');
               error.value = `Session invalide (${response.status}). Redirection...`;
               setTimeout(() => router.push('/login'), 1500);
           } else {
               error.value = errorData.message || `Erreur ${response.status} lors de la récupération des données.`;
           }
           isLoading.value = false;
           return;
      }

      const data = await response.json();
      if (data.status === 'success' && data.data?.user) {
          const user = data.data.user;
          // --- MODIFICATION: Populer editableData ---
          editableData.id = user.id;
          editableData.username = user.username || '';
          editableData.fullName = user.fullName || '';
          editableData.email = user.email || '';
          editableData.genre = user.genre; // Garder null si c'est null
          editableData.pays = user.pays || '';
          editableData.bio = user.bio || '';

          // --- AJOUT: Gérer l'URL de l'avatar ---
          if (user.avatar) {
              originalAvatarUrl.value = `${apiUrlBase}${user.avatar}`;
              avatarPreviewUrl.value = originalAvatarUrl.value; // Commence avec l'avatar actuel
          } else {
              originalAvatarUrl.value = null;
              avatarPreviewUrl.value = 'https://via.placeholder.com/80?text=?'; // Placeholder si pas d'avatar
          }

          console.log("Données utilisateur chargées pour édition:", JSON.parse(JSON.stringify(editableData)));
          console.log("URL avatar original:", originalAvatarUrl.value);

      } else {
          throw new Error("Format de réponse invalide pour les données utilisateur.");
      }
  } catch (err) {
      console.error("Erreur fetchCurrentUserForEdit:", err);
      // Ne pas écraser une erreur de redirection déjà définie
      if (!error.value) {
          error.value = err.message || "Impossible de charger les données pour l'édition.";
      }
  } finally {
      isLoading.value = false;
  }
};

// --- AJOUT: Appeler fetchCurrentUserForEdit au montage ---
onMounted(() => {
  console.log("EditProfile mounted.");
  fetchCurrentUserForEdit();
});

const triggerAvatarUpload = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = (event) => {
  const file = event.target.files?.[0];
  if (file) {
      editableData.avatarFile = file; // Stocke le fichier pour l'upload
      avatarFileName.value = file.name;
      // Générer un aperçu local
      const reader = new FileReader();
      reader.onload = (e) => {
          avatarPreviewUrl.value = e.target.result; // Met à jour l'aperçu
      };
      reader.readAsDataURL(file);
  } else {
     editableData.avatarFile = null;
     avatarFileName.value = '';
     // Revenir à l'avatar original s'il existe, sinon au placeholder
     avatarPreviewUrl.value = originalAvatarUrl.value || 'https://via.placeholder.com/80?text=?';
  }
};

// --- MODIFICATION: Logique de sauvegarde (placeholder pour l'instant) ---
// --- Dans <script setup> de EditProfile.vue ---

// AJOUT: État pour indiquer si une sauvegarde est en cours
const isSaving = ref(false);

const saveProfile = async () => {
    const token = getToken();
    if (!token) {
        error.value = "Non authentifié. Impossible de sauvegarder.";
        router.push('/login');
        return;
    }

    if (isSaving.value) return;
    isSaving.value = true;
    error.value = null;

    console.log('Données à sauvegarder:', JSON.parse(JSON.stringify(editableData)));
    console.log('Fichier avatar à uploader:', editableData.avatarFile);

    const updateUrl = `${apiBaseUrl}/auth/me`; // Ou /users/me
    const method = 'PATCH';

    let bodyContent;
    const headers = {
        'Authorization': `Bearer ${token}`,
    };

    try {
        if (editableData.avatarFile) {
            console.log("Préparation de FormData pour l'envoi...");
            bodyContent = new FormData();
            bodyContent.append('avatar', editableData.avatarFile);
            if (editableData.fullName !== undefined) bodyContent.append('fullName', editableData.fullName || '');
            if (editableData.email !== undefined) bodyContent.append('email', editableData.email || '');
            if (editableData.genre !== undefined) bodyContent.append('genre', editableData.genre === null ? '' : editableData.genre);
            if (editableData.pays !== undefined) bodyContent.append('pays', editableData.pays || '');
            if (editableData.bio !== undefined) bodyContent.append('bio', editableData.bio || '');
            delete headers['Content-Type']; // Important pour FormData
        } else {
            console.log("Préparation de JSON pour l'envoi...");
            const payload = {
                fullName: editableData.fullName,
                email: editableData.email,
                genre: editableData.genre,
                pays: editableData.pays,
                bio: editableData.bio,
            };
            bodyContent = JSON.stringify(payload);
            headers['Content-Type'] = 'application/json';
        }

        console.log(`Envoi ${method} vers ${updateUrl}`);
        const response = await fetch(updateUrl, {
             method: method,
             headers: headers,
             body: bodyContent,
        });

        if (!response.ok) {
            let errorPayload = { message: `HTTP Error ${response.status}` };
            try { errorPayload = await response.json(); } catch (e) { /* ignore */ }
            console.error('Erreur de sauvegarde API:', errorPayload);
            if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem('authToken');
                 error.value = `Session invalide (${response.status}). Redirection...`;
                 setTimeout(() => router.push('/login'), 1500);
                 return;
            }
            throw new Error(errorPayload.message || `Échec de la sauvegarde (Status: ${response.status})`);
        }

        // --- Succès ---
        const result = await response.json();
        console.log('Sauvegarde réussie:', result);

        if (result.status === 'success' && result.data?.user) {
            const updatedUser = result.data.user;
            // Mettre à jour état local (Optionnel si redirection immédiate)
            editableData.id = updatedUser.id;
            editableData.username = updatedUser.username || '';
            editableData.fullName = updatedUser.fullName || '';
            // ... (mettre à jour les autres champs si besoin avant redirection) ...
            if (updatedUser.avatar) {
                originalAvatarUrl.value = `${apiUrlBase}${updatedUser.avatar}`;
                avatarPreviewUrl.value = originalAvatarUrl.value;
            } else { /* ... placeholder ... */ }
            editableData.avatarFile = null;
            avatarFileName.value = '';

            alert('Profil sauvegardé avec succès !'); // Message utilisateur

            // --- AJOUT DE LA REDIRECTION ICI ---
            // Redirige vers la page de profil après succès
            // Ajuste '/profile' si le chemin de ta page de profil est différent
            console.log("Redirection vers /profile...");
            router.push('/profile');
            // --- FIN AJOUT REDIRECTION ---

        } else {
             console.warn("Réponse succès reçue mais format inattendu:", result);
             alert('Profil sauvegardé, mais réponse du serveur inattendue.');
             // Ne pas rediriger si la réponse est suspecte
        }

    } catch (saveError) {
         console.error("Erreur lors de la sauvegarde du profil:", saveError);
         error.value = saveError.message || "Une erreur inconnue est survenue lors de la sauvegarde.";
    } finally {
         isSaving.value = false;
    }
};
</script>

<style scoped>
.edit-profile-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background-color: #f0f2f5; /* Légèrement différent du profil */
  padding: 40px 20px;
}

/* AJOUT: Styles pour chargement et erreur */
.loading-indicator, .error-message {
  text-align: center;
  padding: 40px 20px;
  font-weight: bold;
  font-size: 1.1em;
  margin: 20px auto; /* Centrer et espacer */
  max-width: 600px;
  border-radius: 8px;
}
.loading-indicator { color: #555; }
.error-message { color: #d9534f; background-color: #f2dede; border: 1px solid #ebccd1; white-space: pre-wrap; }

.edit-profile-card {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 900px;
  overflow: hidden;
}

/* Banner and Header Styles */
.profile-banner {
  background: linear-gradient(90deg, #e0f0ff 0%, #fff0e0 100%);
  padding: 20px 30px;
  padding-bottom: 40px;
}

.profile-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* Permet au bouton de passer en dessous sur petit écran */
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  background-color: #eee; /* Fond si image non chargée */
}

.user-details { display: flex; flex-direction: column; }
.user-name { margin: 0; font-size: 1.4em; font-weight: 600; color: #333; }
.user-email { margin: 4px 0 0; font-size: 0.9em; color: #667; }

.save-button {
  background-color: #4a90e2; color: white; border: none;
  border-radius: 8px; padding: 10px 25px; font-size: 0.95em;
  font-weight: 500; cursor: pointer; transition: background-color 0.2s ease;
}
.save-button:hover { background-color: #357abd; }

/* Form Styles */
.profile-form { padding: 30px; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px 30px; }
.form-group { display: flex; flex-direction: column; }
.form-group-bio, .form-group-avatar { grid-column: 1 / -1; } /* Span */

label { margin-bottom: 8px; font-size: 0.9em; font-weight: 500; color: #556; }

input[type="text"], input[type="email"], select, textarea {
  width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0;
  border-radius: 8px; background-color: #fdfdfd; font-size: 0.95em;
  color: #444; box-sizing: border-box;
}
/* Style pour input désactivé */
input:disabled { background-color: #f0f0f0; color: #888; cursor: not-allowed; }
input::placeholder, textarea::placeholder { color: #aaa; }

/* Select custom arrow */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 15px center; background-size: 12px 12px;
}
.select-wrapper { position: relative; }

textarea { min-height: 100px; resize: vertical; }

/* Avatar Upload */
.upload-button {
  display: inline-block; background-color: #eef2ff; color: #4a90e2;
  border: 1px dashed #cdd6f4; border-radius: 8px; padding: 10px 20px;
  font-size: 0.95em; font-weight: 500; cursor: pointer;
  transition: background-color 0.2s ease; text-align: center;
  width: auto; max-width: 250px; /* Augmenté un peu */
}
.upload-button:hover { background-color: #e0e7ff; }
.file-name { font-size: 0.85em; color: #555; margin-top: 8px; display: block; }

/* Bouton Sauvegarder en bas */
.form-actions {
    grid-column: 1 / -1; /* S'assurer qu'il prend toute la largeur de la grille */
    margin-top: 20px; /* Espace au-dessus */
    text-align: right; /* Aligner le bouton à droite */
}
.save-button-bottom {
  /* Utilise les mêmes styles que le bouton du haut ou des styles dédiés */
  background-color: #4a90e2; color: white; border: none;
  border-radius: 8px; padding: 12px 30px; font-size: 1em;
  font-weight: 500; cursor: pointer; transition: background-color 0.2s ease;
}
.save-button-bottom:hover { background-color: #357abd; }

/* Responsive */
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; } /* Stack */
  .profile-summary { flex-direction: column; align-items: flex-start; }
  .save-button { align-self: flex-start; } /* Met le bouton Save du header à gauche sur petit écran */
  .form-actions { text-align: center; } /* Centre le bouton du bas */
  .save-button-bottom { width: 100%; } /* Bouton pleine largeur */
}
@media (max-width: 480px) {
    .user-info { flex-direction: column; align-items: flex-start; gap: 10px;} /* Stack avatar et nom */
    .profile-avatar { width: 60px; height: 60px; }
    .user-name { font-size: 1.2em; }
    .user-email { font-size: 0.85em; }
}

</style>