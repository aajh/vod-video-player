<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <div class="container">
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
</style>
