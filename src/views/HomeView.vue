<template>
    <div class="container">
        <header class="top-nav">
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/watch">Watch</RouterLink>
            <RouterLink to="/record">Record</RouterLink>
        </header>

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
    --padding: 2rem;

    display: flex;
    flex-direction: column;
    padding: 0 var(--padding);
}

.top-nav {
    margin-left: calc(-1 * var(--padding));
    margin-right: calc(-1 * var(--padding));
}

.content {
    max-width: var(--text-content-max-width);
    margin: 0 auto;
}

p {
    margin-top: auto;
}
</style>
