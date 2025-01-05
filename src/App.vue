<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <div class="container">
        <header class="top-nav">
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/watch">Watch</RouterLink>
            <RouterLink to="/record">Record</RouterLink>
        </header>
        <RouterView />
    </div>
</template>

<style scoped>
.container {
    width: 100%;
    font-weight: normal;
    margin: 0 auto;
}

.top-nav {
    display: flex;
    position: fixed;
    width: 100%;
    height: var(--top-nav-height);
    padding: var(--top-nav-padding-top) 0 var(--top-nav-padding-bottom);
    place-items: center;
}

.top-nav a.router-link-exact-active {
    color: var(--color-text);
}

.top-nav a.router-link-exact-active:hover {
    background-color: transparent;
}

.top-nav a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

.top-nav a:first-of-type {
    border: 0;
}
</style>
