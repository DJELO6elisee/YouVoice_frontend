<template>
    <div class="about-page dark">
      <div class="about-container">
        <!-- Section En-tête -->
        <header class="about-header">
          <h1>À Propos de YouVoice</h1>
          <p class="subtitle">Découvrez l'histoire et la technologie derrière l'application.</p>
        </header>
  
        <!-- Section Projet -->
        <section class="about-section project-section">
          <h2>Le Projet YouVoice</h2>
          <p class="subtitle">
            YouVoice est né de l'idée de simplifier le partage d'idées, d'émotions et d'histoires à travers le moyen le plus naturel : la voix. Dans un monde où le texte domine, nous voulions redonner sa place à l'authenticité et à la spontanéité des messages vocaux. Notre mission est de fournir une plateforme intuitive et agréable où chacun peut capturer, partager et écouter des moments de vie sonores.
          </p>
          <div class="project-timeline">
            <span class="timeline-label">Développement :</span>
            <span class="timeline-dates">{{ projectStartDate }} - {{ projectEndDate }}</span>
          </div>
        </section>
  
        <!-- Section Développeur -->
        <section class="about-section developer-section">
        <h2>Le Développeur</h2>
        <div class="developer-card">
          <img :src="developerPhotoUrl" alt="Photo du développeur" class="developer-photo">
          <div class="developer-info">
            <h3>{{ developerName }}</h3>
            <!-- NOUVEAU: Niveau et Filière -->
            <p class="subtitle">
                <i class="fa-solid fa-graduation-cap icon"></i>
                {{ educationLevel }} en {{ fieldOfStudy }}
            </p>
            <p class="developer-contact">
              <a :href="'mailto:' + developerEmail" title="Envoyer un email">
                <i class="fa-solid fa-envelope icon"></i> {{ developerEmail }}
              </a>
            </p>
          </div>
        </div>
      </section>
      
      <section class="about-section skills-section">
        <h2>Compétences Techniques</h2>
        <div class="skills-chart">
            <div v-for="skill in skills" :key="skill.name" class="skill-item">
                <span class="skill-name">{{ skill.name }}</span>
                <div class="skill-bar-container">
                    <div class="skill-bar" :style="{ width: skill.level + '%' }">
                        <span class="skill-level-text">{{ skill.level }}%</span>
                    </div>
                </div>
            </div>
        </div>
        <p class="skills-note">Note : Les niveaux sont indicatifs et basés sur l'auto-évaluation.</p>
      </section>

        <!-- Section Technologies -->
        <section class="about-section tech-section">
          <h2>Technologies Utilisées</h2>
          <div class="tech-grid">
            <div class="tech-category">
              <i class="fa-solid fa-code tech-icon"></i>
              <h3>Frontend</h3>
              <ul>
                <li v-for="tech in frontendTech" :key="tech">{{ tech }}</li>
              </ul>
            </div>
            <div class="tech-category">
              <i class="fa-solid fa-server tech-icon"></i>
              <h3>Backend</h3>
              <ul>
                <li v-for="tech in backendTech" :key="tech">{{ tech }}</li>
              </ul>
            </div>
            <div class="tech-category">
              <i class="fa-solid fa-database tech-icon"></i>
              <h3>Base de Données</h3>
              <ul>
                <li v-for="tech in dbmsTech" :key="tech">{{ tech }}</li>
              </ul>
            </div>
          </div>
        </section>
  
        <!-- Optionnel: Section Contact ou Feedback -->
        <section class="about-section contact-section">
           <h2>Contact</h2>
           <p class="subtitle">
               Votre avis est important ! Pour toute question, suggestion ou rapport de bug,
               n'hésitez pas à nous contacter à l'adresse email ci-dessus.
           </p>
        </section>
  
      </div>
       <footer class="about-footer">
          <router-link :to="{ name: 'Landing' }" class="back-home-link">Retour à l'accueil</router-link>
       </footer>
    </div>
</template>
  

<script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();

  // --- Informations Personnalisables ---
  const developerName = ref('KUYO DJELO JEAN ELISEE');
  const developerEmail = ref('jeaneliseedjelo85@gmail.com');
  // Remplacez par le chemin vers votre photo (dans /src/assets ou /public)
  // Exemple si dans /src/assets/img/ : import devPhoto from '@/assets/img/my_photo.jpg';
  // Exemple si dans /public/img/ : '/img/my_photo.jpg'
  const developerPhotoUrl = ref('/img/default-avatar.png');
  const projectStartDate = ref('14 Mars 2025');
  const projectEndDate = ref('20 Avril 2025');
  const educationLevel = ref('Brevet Technicien Superieur');
  const fieldOfStudy = ref('Développement Web et Mobile');

  const skills = ref([
    { name: 'Vue.js', level: 65 },
    { name: 'Node.js / Express', level: 50 },
    { name: 'JavaScript (ES6+)', level: 60 },
    { name: 'HTML5 & CSS3', level: 90 },
    { name: 'SQL (MySQL)', level: 75 },
    { name: 'API REST', level: 65 },
    { name: 'Git / GitHub', level: 85 },
    { name: 'UI/UX Design (Principes)', level: 60 },
  ]);

  const frontendTech = ref([
    'Vue.js 3 (Composition API)',
    'Vue Router',
    'Vite',
    'HTML5',
    'CSS3 (Variables, Flexbox, Grid)',
  ]);
  
  const backendTech = ref([
    'Node.js',
    'Express.js',
    'Sequelize (ORM)',
    'Socket.IO (Temps réel)',
    'JWT (Authentification)',
    'bcrypt (Hachage mot de passe)',
  ]);
  
  const dbmsTech = ref([
    'MySQL',
  ]);
  
  
</script>
  
<style scoped>
/* --- Variables CSS pour Thèmes --- */
:root {
  /* Thème Clair (utilisé comme fallback ou si la classe .dark n'est pas présente) */
  --about-bg-color: #f8f9fc;        /* Fond très clair */
  --about-section-bg: #ffffff;    /* Sections blanches */
  --developer-card-bg: #f1f3f5;   /* Carte dev légèrement grisée */
  --text-color: #212529;          /* Texte sombre principal */
  --title-color: #1a2b41;         /* Titres un peu plus foncés/bleutés */
  --subtitle-color: #6c757d;      /* Sous-titres gris */
  --link-color: #007bff;           /* Liens bleus vifs */
  --link-hover: #0056b3;         /* Hover lien plus sombre */
  --border-color: #e9ecef;         /* Bordures claires */
  --shadow-color: rgba(0, 0, 0, 0.06);/* Ombre subtile */
  --tech-icon-color: var(--link-color);
  --footer-text-color: #6c757d;
  --timeline-bg: #e7f5ff;         /* Fond dates projet clair */
  --skill-bar-bg: #e9ecef;         /* Fond barre compétence clair */
  --skill-bar-fill: linear-gradient(90deg, #4dabf7 0%, #007bff 100%); /* Dégradé barre compétence */
  --skill-text-color: #ffffff;      /* Texte compétence blanc */
  --photo-border-color: #ffffff;    /* Bordure photo claire */
}

/* Définition des variables pour le thème sombre appliqué via .dark */
.about-page.dark {
  --about-bg-color: #1a1d24;        /* Fond très sombre */
  --about-section-bg: #252a33;    /* Sections un peu plus claires */
  --developer-card-bg: #1f232b;   /* Carte dev très sombre */
  --text-color: #e4e6eb;          /* Texte clair principal */
  --title-color: #ffffff;         /* Titres blancs */
  --subtitle-color: #adb5bd;      /* Sous-titres gris clair */
  --link-color: #4dabf7;           /* Liens bleus clairs */
  --link-hover: #74c0fc;         /* Hover lien encore plus clair */
  --border-color: #373a40;         /* Bordures sombres */
  --shadow-color: rgba(0, 0, 0, 0.2); /* Ombre plus visible */
  --tech-icon-color: var(--link-color);
  --footer-text-color: #adb5bd;
  --timeline-bg: #343a40;         /* Fond dates projet sombre */
  --skill-bar-bg: #373a40;         /* Fond barre compétence sombre */
  --skill-bar-fill: linear-gradient(90deg, #364fc7 0%, #4dabf7 100%); /* Dégradé bleu/violet */
  --skill-text-color: #ffffff;
  --photo-border-color: #495057;    /* Bordure photo sombre */
}

/* --- Styles Généraux utilisant les variables --- */

.about-page {
  background-color: var(--about-bg-color); /* Applique le fond */
  color: var(--about-text-color);      /* Applique la couleur de texte */
  padding: 40px 20px;
  font-family: 'Roboto', 'Arial', sans-serif;
  line-height: 1.7;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s, color 0.3s; /* Transition douce */
}

.about-container {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  flex-grow: 1;
}

/* --- En-tête --- */
.about-header {
  text-align: center;
  margin-bottom: 50px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color); /* Utilise variable bordure */
  transition: border-color 0.3s;
}

.about-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--title-color); /* Utilise variable titre */
  margin-bottom: 10px;
  transition: color 0.3s;
}

.about-header .subtitle {
  font-size: 1.1rem;
  color: var(--subtitle-color); /* Utilise variable sous-titre */
  transition: color 0.3s;
}

/* --- Sections --- */
.about-section {
  background-color: var(--about-section-bg); /* Utilise variable fond section */
  padding: 30px;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px var(--shadow-color); /* Utilise variable ombre */
  border: 1px solid var(--border-color); /* Utilise variable bordure */
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.about-section h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--title-color); /* Utilise variable titre */
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--link-color); /* Utilise variable lien */
  display: inline-block;
  transition: color 0.3s, border-color 0.3s;
}

.about-section p {
  margin-bottom: 15px;
  color: var(--about-text-color); /* Utilise variable texte */
  transition: color 0.3s;
}

/* Section Projet */
.project-timeline {
  margin-top: 20px;
  font-size: 0.95rem;
  color: var(--text-color); /* Utilise variable texte standard */
  transition: color 0.3s;
}
.timeline-label {
  font-weight: 600;
  margin-right: 8px;
}
.timeline-dates {
  background-color: var(--timeline-bg); /* Utilise variable fond timeline */
  color: var(--text-color); /* Assurer lisibilité */
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  transition: background-color 0.3s, color 0.3s;
}

/* Section Développeur */
.developer-section {
  background-color: var(--developer-card-bg); /* Utilise variable fond carte */
}

.developer-card {
  display: flex;
  align-items: center;
  gap: 25px;
  flex-wrap: wrap; /* Pour passer en colonne sur mobile */
}

.developer-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--photo-border-color); /* Utilise variable bordure photo */
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: border-color 0.3s;
}

.developer-info {
    flex: 1; /* Permet aux infos de prendre l'espace restant */
}

.developer-info h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--title-color);
  transition: color 0.3s;
}

.developer-education {
  font-size: 0.95rem;
  color: var(--subtitle-color); /* Utilise variable sous-titre */
  margin-bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
}
.developer-education .icon {
    color: var(--link-color); /* Utilise variable lien */
    transition: color 0.3s;
}

.developer-contact {
  margin-bottom: 10px;
}
.developer-contact a {
  color: var(--link-color); /* Utilise variable lien */
  text-decoration: none;
  margin-right: 15px; /* Espace entre les liens */
  transition: color 0.2s;
  display: inline-flex; /* Pour aligner icône et texte */
  align-items: center;
  gap: 5px;
}
.developer-contact a:hover {
  color: var(--link-hover); /* Utilise variable hover lien */
  text-decoration: underline;
}
.developer-contact .icon {
  font-size: 1.1em; /* Ajuster taille icône */
}

/* Section Compétences */
.skills-section {
    /* Styles inchangés pour la structure */
}
.skills-chart {
    width: 100%;
    margin-top: 15px;
}
.skill-item {
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.skill-name {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--text-color); /* Utilise variable texte */
    transition: color 0.3s;
}

.skill-bar-container {
    width: 100%;
    background-color: var(--skill-bar-bg); /* Utilise variable fond barre */
    border-radius: 5px;
    height: 22px;
    overflow: hidden;
    position: relative;
    transition: background-color 0.3s;
}

.skill-bar {
    /* background-color: var(--link-color); */ /* Remplacé par dégradé */
    background: var(--skill-bar-fill); /* Utilise variable remplissage barre */
    height: 100%;
    border-radius: 5px;
    transition: width 0.8s ease-out, background 0.3s;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: relative;
}

.skill-level-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--skill-text-color); /* Utilise variable texte compétence */
    padding: 0 8px;
    line-height: 22px;
    white-space: nowrap;
    position: relative;
    z-index: 1;
    /* text-shadow: 1px 1px 1px rgba(0,0,0,0.4); */ /* Optionnel */
}

.skills-note {
    font-size: 0.85rem;
    color: var(--subtitle-color); /* Utilise variable sous-titre */
    text-align: center;
    margin-top: 25px;
    font-style: italic;
    transition: color 0.3s;
}

/* Section Technologies */
.tech-section { /* ... */ }
.tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 30px;
}
.tech-category {
    text-align: center;
}

.tech-icon {
    font-size: 2.5rem;
    color: var(--tech-icon-color); /* Utilise variable icône tech */
    margin-bottom: 15px;
    display: block;
    transition: color 0.3s;
}

.tech-category h3 {
    font-size: 1.3rem;
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--title-color);
    transition: color 0.3s;
}

.tech-category ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.tech-category li {
    margin-bottom: 8px;
    font-size: 0.95rem;
    color: var(--text-color); /* Utilise variable texte */
    transition: color 0.3s;
}

/* Section Contact */
.contact-section {
    text-align: center;
}

/* --- Pied de page --- */
.about-footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color); /* Utilise variable bordure */
    transition: border-color 0.3s;
}

.back-home-link {
    color: var(--link-color); /* Utilise variable lien */
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s;
}

.back-home-link:hover {
    color: var(--link-hover); /* Utilise variable hover lien */
    text-decoration: underline;
}

/* --- Responsivité --- */
@media (max-width: 768px) {
    .about-page { padding: 20px 15px; }
    .about-header h1 { font-size: 2rem; }
    .about-header .subtitle { font-size: 1rem; }
    .about-section { padding: 20px; }
    .about-section h2 { font-size: 1.5rem; }
    .developer-card { flex-direction: column; text-align: center; }
    .developer-info { width: 100%; }
    .developer-photo { width: 100px; height: 100px; margin-bottom: 10px; }
    .tech-grid { gap: 20px; }
    .skill-name { font-size: 0.9rem; }
    .skill-bar-container { height: 20px; }
    .skill-level-text { font-size: 0.75rem; line-height: 20px; }
}

@media (max-width: 480px) {
    .about-header h1 { font-size: 1.8rem; }
    .about-section h2 { font-size: 1.4rem; }
    .tech-grid { grid-template-columns: 1fr; }
    .tech-category { margin-bottom: 20px; }
    .tech-category:last-child { margin-bottom: 0; }
}
</style>