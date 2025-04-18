<template>
    <div class="about-page">
      <div class="about-container">
        <!-- Section En-tête -->
        <header class="about-header">
          <h1>À Propos de YouVoice</h1>
          <p class="subtitle">Découvrez l'histoire et la technologie derrière l'application.</p>
        </header>
  
        <!-- Section Projet -->
        <section class="about-section project-section">
          <h2>Le Projet YouVoice</h2>
          <p>
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
            <p class="developer-education">
                <i class="fa-solid fa-graduation-cap icon"></i>
                {{ educationLevel }} en {{ fieldOfStudy }}
            </p>
            <p class="developer-contact">
              <a :href="'mailto:' + developerEmail" title="Envoyer un email">
                <i class="fa-solid fa-envelope icon"></i> {{ developerEmail }}
              </a>
              <!-- Autres liens (LinkedIn, etc.) -->
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
           <h2>Nous Contacter</h2>
           <p>
               Votre avis est important ! Pour toute question, suggestion ou rapport de bug,
               n'hésitez pas à nous contacter à l'adresse email ci-dessus.
           </p>
        </section>
  
      </div>
       <!-- Pied de page spécifique à cette page ou utiliser un footer global -->
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
  const developerName = ref('Amani Saint cair'); // Remplacez par votre Nom et Prénom
  const developerEmail = ref('votre.email@example.com'); // Remplacez par votre email
  // Remplacez par le chemin vers votre photo (dans /src/assets ou /public)
  // Exemple si dans /src/assets/img/ : import devPhoto from '@/assets/img/my_photo.jpg';
  // Exemple si dans /public/img/ : '/img/my_photo.jpg'
  const developerPhotoUrl = ref('/img/default-avatar.png'); // Mettez le chemin réel
  const projectStartDate = ref('Janvier 2024'); // Date de début
  const projectEndDate = ref('Juin 2024'); // Date de fin (ou "En cours")
  const educationLevel = ref('Licence Professionnelle'); // Ex: Master, Licence, BTS, etc.
  const fieldOfStudy = ref('Développement Web et Mobile');

  const skills = ref([
    { name: 'Vue.js / Nuxt', level: 85 },
    { name: 'Node.js / Express', level: 80 },
    { name: 'JavaScript (ES6+)', level: 90 },
    { name: 'HTML5 & CSS3', level: 95 },
    { name: 'SQL (MySQL/PostgreSQL)', level: 75 },
    { name: 'API REST & GraphQL', level: 70 },
    { name: 'Git / GitHub', level: 85 },
    { name: 'UI/UX Design (Principes)', level: 60 },
    // Ajoutez ou modifiez vos compétences et niveaux
  ]);

  const frontendTech = ref([
    'Vue.js 3 (Composition API)',
    'Vue Router',
    'Vite',
    'HTML5',
    'CSS3 (Variables, Flexbox, Grid)',
    // Ajoutez d'autres libs/frameworks front (Pinia, Axios, etc.)
  ]);
  
  const backendTech = ref([
    'Node.js',
    'Express.js',
    'Sequelize (ORM)',
    'Socket.IO (Temps réel)',
    'JWT (Authentification)',
    'bcrypt (Hachage mot de passe)',
    // Ajoutez d'autres technos back (Multer, etc.)
  ]);
  
  const dbmsTech = ref([
    'MySQL', // Ou PostgreSQL, MariaDB, etc.
    // Ajoutez d'autres outils liés (ex: phpMyAdmin si utilisé en dev)
  ]);
  
  // Si vous avez importé l'image depuis src/assets:
  // const developerPhotoUrl = ref(devPhoto);
  
</script>
  
<style scoped>
  /* --- Variables --- */
  :root {
    --about-bg-color: #fdfdff;
    --about-text-color: #343a40;
    --about-title-color: #2c3e50;
    --about-link-color: #3498db;
    --about-link-hover: #2980b9;
    --about-section-bg: #ffffff;
    --about-border-color: #ecf0f1;
    --developer-card-bg: #f8f9fa;
    --tech-icon-color: #3498db;
    --footer-text-color: #7f8c8d;
  }
  
  .about-page {
    background-color: var(--about-bg-color);
    color: var(--about-text-color);
    padding: 40px 20px;
    font-family: 'Roboto', 'Arial', sans-serif; /* Police claire */
    line-height: 1.7;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .about-container {
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    flex-grow: 1; /* Prend l'espace vertical */
  }
  
  /* --- En-tête --- */
  .about-header {
    text-align: center;
    margin-bottom: 50px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--about-border-color);
  }
  
  .about-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--about-title-color);
    margin-bottom: 10px;
  }
  
  .about-header .subtitle {
    font-size: 1.1rem;
    color: #7f8c8d; /* Gris doux */
  }
  
  /* --- Sections --- */
  .about-section {
    background-color: var(--about-section-bg);
    padding: 30px;
    margin-bottom: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--about-border-color);
  }
  
  .about-section h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--about-title-color);
    margin-top: 0;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--about-link-color);
    display: inline-block; /* Pour que la bordure s'adapte au texte */
  }
  
  .about-section p {
    margin-bottom: 15px;
    color: var(--about-text-color);
  }
  
  /* Section Projet */
  .project-timeline {
    margin-top: 20px;
    font-size: 0.95rem;
    color: #555;
  }
  .timeline-label {
    font-weight: 600;
    margin-right: 8px;
  }
  .timeline-dates {
    background-color: #eef4ff;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: monospace; /* Pour un look un peu technique */
  }
  
  /* Section Développeur */
  .developer-section {
    background-color: var(--developer-card-bg); /* Fond légèrement différent */
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
    border: 4px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .developer-info h3 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--about-title-color);
  }

    .developer-education {
        font-size: 0.95rem;
        color: #555;
        margin-bottom: 12px;
        display: inline-flex; /* Pour icône */
        align-items: center;
        gap: 6px;
    }
    .developer-education .icon {
        color: var(--about-link-color); /* Ou une autre couleur */
    }

    .skills-chart {
    width: 100%;
    margin-top: 15px;
}

.skill-item {
    margin-bottom: 18px;
    display: flex;
    flex-direction: column; /* Label au-dessus de la barre */
    gap: 6px; /* Espace entre label et barre */
}

.skill-name {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--about-text-color);
}

.skill-bar-container {
    width: 100%;
    background-color: #e9ecef; /* Fond de la barre */
    border-radius: 5px;
    height: 22px; /* Hauteur de la barre */
    overflow: hidden; /* Pour les coins arrondis de la barre interne */
    position: relative; /* Pour positionner le texte */
}

.skill-bar {
    background-color: var(--about-link-color); /* Couleur de la barre de progression */
    height: 100%;
    border-radius: 5px; /* Coins arrondis */
    transition: width 0.8s ease-out; /* Animation de la largeur */
    display: flex; /* Pour aligner le texte */
    align-items: center;
    justify-content: flex-end; /* Positionner le texte à droite */
    position: relative; /* Assurer que le texte est au-dessus */
}

.skill-level-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: white; /* Texte blanc sur la barre */
    padding: 0 8px; /* Espace autour du texte */
    line-height: 22px; /* Même hauteur que la barre */
    white-space: nowrap; /* Empêcher le retour à la ligne */
    position: relative; /* Pour être sûr qu'il est visible */
    z-index: 1;
}

/* Note optionnelle sous le graphique */
.skills-note {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
    text-align: center;
    margin-top: 25px;
    font-style: italic;
}

  .developer-contact {
    margin-bottom: 10px;
  }
  
  .developer-contact a {
    color: var(--about-link-color);
    text-decoration: none;
    margin-right: 15px; /* Espace entre les liens */
    transition: color 0.2s;
    display: inline-flex; /* Pour aligner icône et texte */
    align-items: center;
    gap: 5px;
  }
  
  .developer-contact a:hover {
    color: var(--about-link-hover);
    text-decoration: underline;
  }
  
  .developer-contact .icon {
    font-size: 1.1em; /* Ajuster taille icône */
  }
  
  /* Section Technologies */
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
    color: var(--tech-icon-color);
    margin-bottom: 15px;
    display: block; /* Pour centrer plus facilement */
  }
  
  .tech-category h3 {
    font-size: 1.3rem;
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--about-title-color);
  }
  
  .tech-category ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .tech-category li {
    margin-bottom: 8px;
    font-size: 0.95rem;
    color: #555;
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
    border-top: 1px solid var(--about-border-color);
  }
  
  .back-home-link {
    color: var(--about-link-color);
    text-decoration: none;
    font-weight: 500;
  }
  
  .back-home-link:hover {
    color: var(--about-link-hover);
    text-decoration: underline;
  }
  
  
  /* --- Responsivité --- */
  @media (max-width: 768px) {
    .about-page {
      padding: 20px 15px;
    }
    .about-header h1 {
      font-size: 2rem;
    }
    .about-header .subtitle {
      font-size: 1rem;
    }
    .about-section {
      padding: 20px;
    }
    .about-section h2 {
      font-size: 1.5rem;
    }
    .developer-card {
      flex-direction: column; /* Empiler photo et infos */
      text-align: center;
    }
    .developer-info {
        width: 100%;
    }
    .developer-photo {
        width: 100px;
        height: 100px;
        margin-bottom: 10px;
    }
     .tech-grid {
        gap: 20px;
     }

     .skill-name {
      font-size: 0.9rem;
  }
  .skill-bar-container {
      height: 20px;
  }
   .skill-level-text {
      font-size: 0.75rem;
      line-height: 20px;
   }
}
  
  
  @media (max-width: 480px) {
    .about-header h1 {
      font-size: 1.8rem;
    }
    .about-section h2 {
        font-size: 1.4rem;
    }
    .tech-grid {
        grid-template-columns: 1fr; /* Une seule colonne */
    }
    .tech-category {
        margin-bottom: 20px;
    }
    .tech-category:last-child {
        margin-bottom: 0;
    }
  }
</style>