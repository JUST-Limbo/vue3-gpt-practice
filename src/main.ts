import { createApp } from 'vue'
import { createPinia } from 'pinia'

import ElementPlusPower from "./plugins/ElementPlus"

import '@/styles/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(ElementPlusPower)
app.use(createPinia())
app.use(router)

app.mount('#app')
