<script setup lang="ts">
import { RouterLink } from 'vue-router';
import Toolbar from '@/components/Toolbar.vue';
</script>

<template>
    <Toolbar>
        <nav class="top-nav">
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/watch">Watch</RouterLink>
            <RouterLink to="/record">Record</RouterLink>
        </nav>
    </Toolbar>
</template>

<style scoped>
.top-nav {
    display: flex;
    place-items: center;

    a.router-link-exact-active {
        color: var(--color-text);
    }

    a.router-link-exact-active:hover {
        background-color: transparent;
    }

    a {
        display: inline-block;
        padding: 0 1rem;
        border-left: 1px solid var(--color-border);
    }

    a:first-of-type {
        border: 0;
    }
}

@media (max-width: 38rem) {
    .top-nav {
        font-size: 0.75rem;

        a {
            padding: 0 0.5rem;
        }
    }
}
</style>
