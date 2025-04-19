<template>
    <div class="landing-page">
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
  
  import { useRouter } from 'vue-router';
  const router = useRouter();
  
</script>


<style>  
/* --- Variables CSS pour personnalisation --- */
.landing-page {
  --primary-color: #0077FF;
  --accent-color: #FFA500; 
  --background-gradient-start: #005BBB;
  --background-gradient-end: #FF8C00;
  --text-color-hero: #FFFFFF;
  --text-color-secondary: #EAEAEA;
  --button-primary-bg: var(--accent-color);
  --button-primary-text: #FFFFFF;
  --button-secondary-border: rgba(255, 255, 255, 0.8);
  --button-secondary-text: var(--text-color-hero);
  --button-secondary-hover-bg: rgba(255, 255, 255, 0.15);
  --about-button-border: rgba(255, 255, 255, 0.8);
  --about-button-text: var(--text-color-hero);
  --about-button-hover-bg: #FFFFFF;
  --about-button-hover-text: var(--primary-color);
  --footer-bg: rgba(0, 0, 0, 0.3);
  --footer-text: #D0D0D0;
  --app-logo-color: var(--text-color-hero);
  --hero-overlay-color: rgba(0, 20, 60, 0.15);
}

/* --- Styles Généraux --- */
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--background-gradient-start) 0%, var(--background-gradient-end) 100%);
  color: var(--text-color-hero);
  font-family: 'Poppins', 'Arial', sans-serif;
  overflow-x: hidden;
  position: relative;
}

/* Overlay pour contraste texte */
.landing-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--hero-overlay-color);
  z-index: 1;
  pointer-events: none;
}

/* --- En-tête --- */
.landing-header {
  padding: 20px 0;
  position: absolute;
  width: 100%;
  z-index: 10; /* Au-dessus de l'overlay */
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-logo {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--app-logo-color);
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.about-button {
  background: none;
  border: 1.5px solid var(--about-button-border);
  color: var(--about-button-text);
  padding: 8px 20px;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s, color 0.3s;
}

.about-button:hover {
  background-color: var(--about-button-hover-bg);
  color: var(--about-button-hover-text);
}

/* --- Section Hero --- */
.hero-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 140px 20px 80px 20px;
  position: relative;
  z-index: 2; 
}

.hero-content {
  max-width: 750px;
}

.welcome-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--text-color-hero);
  margin-bottom: 20px;
  line-height: 1.2;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin-bottom: 40px;
  line-height: 1.7;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.15); /* Ombre plus subtile */
}

/* --- Boutons CTA --- */
.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 35px;
  border: none;
  border-radius: 30px;
  font-size: 1.05rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.3s ease, background-color 0.3s, border-color 0.3s;
  min-width: 160px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.btn:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background-color: var(--button-primary-bg);
  color: var(--button-primary-text);
}
.btn-primary:hover {
   filter: brightness(1.1);
}

.btn-secondary {
  background-color: transparent;
  color: var(--button-secondary-text);
  border: 2px solid var(--button-secondary-border);
}
.btn-secondary:hover {
  background-color: var(--button-secondary-hover-bg);
  border-color: var(--button-secondary-border);
  color: var(--button-secondary-text);
}

/* --- Décoration Hero (Optionnel - masquée) --- */
/* .hero-decoration {
  display: none;
} */

/* --- Pied de page --- */
.landing-footer {
  background-color: var(--footer-bg);
  color: var(--footer-text);
  text-align: center;
  padding: 20px 20px;
  font-size: 0.9rem;
  margin-top: auto;
  position: relative;
  z-index: 2; 
}

/* --- Responsivité --- */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2.5rem;
  }
  .welcome-subtitle {
    font-size: 1.1rem;
  }
  .hero-section {
    padding: 120px 20px 60px 20px;
  }
  .cta-buttons {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  .btn {
    width: 85%;
    max-width: 320px;
    padding: 12px 30px;
    font-size: 1rem;
  }
   .header-content {
       padding: 0 20px;
   }
}

@media (max-width: 480px) {
   .landing-header {
       padding: 15px 0;
   }
   .header-content {
       padding: 0 15px;
   }
   .app-logo {
       font-size: 1.4rem;
   }
   .about-button {
       padding: 7px 16px;
       font-size: 0.85rem;
   }
   .welcome-title {
       font-size: 2rem;
   }
   .welcome-subtitle {
       font-size: 1rem;
   }
   .hero-section {
       padding: 100px 15px 50px 15px;
   }
   .btn {
      padding: 11px 28px;
      font-size: 0.95rem;
      width: 90%;
   }
}
</style>