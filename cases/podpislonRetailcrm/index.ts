import { createWidgetEndpoint } from '@retailcrm/embed-ui'
import { fromInsideIframe } from '@remote-ui/rpc'
import { createI18n } from 'vue-i18n'

import PodpislonRetailcrmExtension from './PodpislonRetailcrmExtension.vue'
import VCalendar from 'v-calendar';
import 'v-calendar/dist/style.css';

createWidgetEndpoint({
    async run (createApp, root, pinia) {

        try {
            const i18n = createI18n({ legacy: false, fallbackLocale: 'en-GB' })
            const app = createApp(PodpislonRetailcrmExtension)
            app.use(pinia)
            app.use(i18n)
            app.use(VCalendar, {})
            app.mount(root)
            return () => {
                app.unmount()
            }
        } catch (error: any) {
            throw error;
        }
    },
}, fromInsideIframe())
