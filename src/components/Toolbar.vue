<template>
    <header class="toolbar" id="toolbar">
        <slot />
    </header>
</template>

<style scoped>
.toolbar {
    display: grid;
    width: 100%;
    height: var(--toolbar-height);
    padding-top: 0.5rem;
    grid-gap: 1rem;
    align-items: center;
}

@media (max-width: 38rem) {
    .toolbar {
        grid-gap: 0.75rem;
        padding-top: 0.25rem;
    }
}
</style>
