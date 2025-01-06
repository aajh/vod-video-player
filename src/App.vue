<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <div class="container">
        <header class="toolbar" id="toolbar">
            <nav class="top-nav">
                <RouterLink to="/">Home</RouterLink>
                <RouterLink to="/watch">Watch</RouterLink>
                <RouterLink to="/record">Record</RouterLink>
            </nav>
        </header>
        <div class="content">
            <RouterView />
        </div>
    </div>
</template>

<style scoped>
.container {
    width: 100%;
    font-weight: normal;
    margin: 0 auto;
}

.toolbar {
    --nav-width: 15rem;

    display: grid;
    width: 100%;
    height: var(--toolbar-height);
    grid-template-columns: minmax(var(--nav-width), 1fr) minmax(0, 2fr) minmax(var(--nav-width), 1fr);
    padding-top: 0.5rem;
    grid-gap: 1rem;
}

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
    .toolbar {
        --nav-width: 10rem;
        grid-gap: 0.75rem;
        padding-top: 0.25rem;
    }

    .top-nav {
        font-size: 0.75rem;

        a {
            padding: 0 0.5rem;
        }
    }
}
</style>
