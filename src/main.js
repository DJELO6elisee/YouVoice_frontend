import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Importer le router

const app = createApp(App)

app.use(router) // Dire à l'application Vue d'utiliser le router

app.mount('#app')