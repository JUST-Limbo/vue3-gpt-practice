import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/home/index.vue'
import TestView from '@/views/test/index.vue'
import DeepseekChatView from '@/views/deepseek-chat/index.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: "/test",
            name: 'test',
            component: TestView
        },
        {
            path: '/deepseek-chat',
            name: 'deepseek-chat',
            component: DeepseekChatView
        }
    ]
})

export default router
