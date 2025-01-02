<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
    <div class="container">
        <header>
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/watch">Watch</RouterLink>
            <RouterLink to="/record">Record</RouterLink>
        </header>

        <div class="content">
            <RouterView />
        </div>
    </div>
</template>

<style scoped>
.container {
    max-width: 1280px;
    margin: 0 auto;
    font-weight: normal;
}

header {
    display: flex;
    place-items: center;
    font-size: 1rem;
    line-height: 1.5;

    padding: 1rem 0;
    margin-top: 0.5rem;
}

nav {
    width: 100%;
    margin-top: 2rem;

    text-align: left;
    margin-left: -1rem;

}

header a.router-link-exact-active {
    color: var(--color-text);
}

header a.router-link-exact-active:hover {
    background-color: transparent;
}

header a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

header a:first-of-type {
    border: 0;
}
</style>
