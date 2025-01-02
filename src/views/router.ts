import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/watch',
            name: 'watch',
            component: () => import('./WatchView.vue'),
        },
        {
            path: '/record',
            name: 'record',
            component: () => import('./RecordView.vue'),
        },
    ],
})

export default router
