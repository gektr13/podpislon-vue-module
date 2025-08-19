import { createWidgetEndpoint } from '@retailcrm/embed-ui'
import { fromInsideIframe } from '@remote-ui/rpc'
import { createI18n } from 'vue-i18n'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import SettingsView from './components/general/SettingsView.vue'


// Проверяем, есть ли RetailCRM контекст
const isRetailCRMContext = typeof window !== 'undefined' && window.parent !== window

if (isRetailCRMContext) {
    createWidgetEndpoint({
        async run (createApp, root, pinia) {
            const i18n = createI18n({ legacy: false, fallbackLocale: 'ru' })
            const app = createApp(SettingsView)

            app.use(pinia)
            app.use(i18n)
            app.mount(root)

            return () => app.unmount()
        },
    }, fromInsideIframe())
} else {

    try {
        const app = createApp(SettingsView)
        const pinia = createPinia()
        
        app.use(pinia)
        
        const root = document.getElementById('root')
        if (root) {
            app.mount(root)
        }
    } catch (error) {
        console.error('Failed to create standalone app:', error)
    }
} 