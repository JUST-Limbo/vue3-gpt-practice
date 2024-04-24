import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import type { Plugin } from 'vue'

const ElementPlusPower: Plugin = {
    install (app) {
        app.use(ElementPlus)
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
            app.component(key, component)
        }

    }
}

export default ElementPlusPower
