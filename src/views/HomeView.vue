<template>
    <div class="container">
        <main class="content">
            <h1>Home page</h1>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                officia deserunt mollit anim id est laborum.
            </p>
        </main>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    margin-top: var(--top-nav-height);
    padding: 0 2rem;
}

.content {
    max-width: var(--text-content-max-width);
    margin: 2rem auto;
}

p {
    margin-top: auto;
}
</style>
