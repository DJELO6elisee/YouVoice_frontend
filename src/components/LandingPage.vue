<template>
    <div class="landing-page">
      <!-- En-tête simple avec le bouton "À Propos" -->
      <header class="landing-header">
        <div class="header-content">
          <span class="app-logo">YouVoice</span> <!-- Ou mettez votre logo ici -->
          <router-link :to="{ name: 'About' }" class="about-button">À Propos</router-link>
        </div>
      </header>
  
      <!-- Section Principale (Hero) -->
      <main class="hero-section">
        <div class="hero-content">
          <h1 class="welcome-title">Bienvenue sur YouVoice !</h1>
          <p class="welcome-subtitle">
            Capturez, partagez et écoutez des notes vocales en toute simplicité.
            Votre voix, votre histoire.
          </p>
  
          <!-- Boutons d'action -->
          <div class="cta-buttons">
            <router-link :to="{ name: 'Login' }" class="btn btn-primary">Connexion</router-link> <!-- Adaptez le :to -->
            <router-link :to="{ name: 'Register' }" class="btn btn-secondary">Inscription</router-link> <!-- Adaptez le :to -->
          </div>
        </div>
        <!-- Optionnel: Ajouter une illustration ou une vague décorative en bas -->
        <div class="hero-decoration"></div>
      </main>
  
      <!-- Optionnel: Pied de page simple -->
      <footer class="landing-footer">
        <p>© {{ new Date().getFullYear() }} YouVoice. Tous droits réservés.</p>
      </footer>
    </div>
</template>
  
  <script setup>
  // Pas besoin de logique JavaScript complexe ici pour une page statique,
  // mais vous pourriez vouloir importer useRouter si vous préférez
  // naviguer par programmation au lieu d'utiliser <router-link>
  import { useRouter } from 'vue-router';
  const router = useRouter();
  // const goToLogin = () => router.push({ name: 'Login' });
  // const goToRegister = () => router.push({ name: 'Register' });
  // const goToAbout = () => router.push({ name: 'About' });
  </script>
  
<style scoped>
  /* --- Variables CSS pour personnalisation --- */
  :root {
    --primary-color: #4a90e2; /* Un bleu attrayant */
    --secondary-color: #50e3c2; /* Une touche de turquoise/vert */
    --background-gradient-start: #f8faff; /* Dégradé de fond léger */
    --background-gradient-end: #eef4ff;
    --text-color-hero: #333;
    --text-color-light: #f8f9fa;
    --text-color-secondary: #555;
    --button-text-color: #ffffff;
    --footer-bg: #343a40;
    --footer-text: #adb5bd;
  }
  
  .landing-page {
    min-height: 100vh; /* Prend au moins toute la hauteur de l'écran */
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, var(--background-gradient-start) 0%, var(--background-gradient-end) 100%);
    font-family: 'Poppins', 'Arial', sans-serif; /* Police moderne, ajoutez l'import si besoin */
    overflow-x: hidden; /* Empêche le défilement horizontal */
  }
  
  /* --- En-tête --- */
  .landing-header {
    padding: 15px 0;
    /* background-color: rgba(255, 255, 255, 0.8); */ /* Optionnel: léger fond */
    /* backdrop-filter: blur(5px); */ /* Optionnel: effet de flou */
    position: absolute; /* Pour le positionner au-dessus du hero */
    width: 100%;
    z-index: 10;
  }
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .app-logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
  }
  
  .about-button {
    background: none;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    padding: 8px 18px;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.3s, color 0.3s;
  }
  
  .about-button:hover {
    background-color: var(--primary-color);
    color: var(--button-text-color);
  }
  
  /* --- Section Hero --- */
  .hero-section {
    flex-grow: 1; /* Prend l'espace restant */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Centre verticalement */
    align-items: center; /* Centre horizontalement */
    text-align: center;
    padding: 120px 20px 60px 20px; /* Padding haut pour laisser place au header */
    position: relative; /* Pour la décoration */
  }
  
  .hero-content {
    max-width: 700px; /* Limite la largeur du contenu */
    z-index: 1; /* Au-dessus de la décoration */
  }
  
  .welcome-title {
    font-size: 3rem; /* Grande taille pour l'impact */
    font-weight: 700;
    color: var(--text-color-hero);
    margin-bottom: 15px;
    line-height: 1.2;
  }
  
  .welcome-subtitle {
    font-size: 1.1rem;
    color: var(--text-color-secondary);
    margin-bottom: 35px;
    line-height: 1.6;
    max-width: 550px; /* Limiter la largeur du sous-titre */
    margin-left: auto;
    margin-right: auto;
  }
  
  /* --- Boutons CTA (Call To Action) --- */
  .cta-buttons {
    display: flex;
    justify-content: center;
    gap: 15px; /* Espace entre les boutons */
    flex-wrap: wrap; /* Permet aux boutons de passer à la ligne sur petit écran */
  }
  
  .btn {
    padding: 12px 30px;
    border: none;
    border-radius: 25px; /* Boutons arrondis */
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-width: 140px; /* Largeur minimale */
  }
  
  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  
  .btn-primary {
    background-color: var(--primary-color);
    color: var(--button-text-color);
  }
  
  .btn-secondary {
    background-color: transparent;
    color: var(--primary-color);
    border: 2px solid var(--primary-color);
  }
  
  .btn-secondary:hover {
    background-color: var(--primary-color);
    color: var(--button-text-color);
  }
  
  /* --- Décoration Hero (Optionnel) --- */
  .hero-decoration {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100px; /* Hauteur de la vague/forme */
    /* Exemple avec une vague SVG ou une image de fond */
    /* background-image: url('path/to/your/wave.svg'); */
    /* background-repeat: no-repeat; */
    /* background-position: bottom center; */
    /* background-size: cover; */
    /* Ou un simple dégradé pour simuler */
    background: linear-gradient(to top, rgba(255, 255, 255, 0.5), transparent);
    z-index: 0;
  }
  
  
  /* --- Pied de page --- */
  .landing-footer {
    background-color: var(--footer-bg);
    color: var(--footer-text);
    text-align: center;
    padding: 15px 20px;
    font-size: 0.85rem;
    margin-top: auto; /* Pousse le footer en bas si le contenu est court */
  }
  
  /* --- Responsivité --- */
  @media (max-width: 768px) {
    .welcome-title {
      font-size: 2.2rem; /* Réduire la taille du titre */
    }
  
    .welcome-subtitle {
      font-size: 1rem;
    }
  
    .hero-section {
      padding-top: 100px; /* Ajuster le padding */
    }
  
    .cta-buttons {
      flex-direction: column; /* Empiler les boutons */
      align-items: center; /* Centrer les boutons empilés */
      gap: 12px;
    }
  
    .btn {
      width: 80%; /* Rendre les boutons plus larges sur mobile */
      max-width: 300px;
    }
  }
  
  @media (max-width: 480px) {
     .landing-header {
         padding: 10px 0;
     }
     .header-content {
         padding: 0 15px;
     }
     .app-logo {
         font-size: 1.3rem;
     }
     .about-button {
         padding: 6px 14px;
         font-size: 0.9rem;
     }
     .welcome-title {
         font-size: 1.8rem;
     }
     .welcome-subtitle {
         font-size: 0.9rem;
     }
     .hero-section {
         padding: 80px 15px 40px 15px;
     }
     .btn {
        padding: 10px 25px;
        font-size: 0.95rem;
     }
  }
  
</style>