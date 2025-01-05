<script setup lang="ts">
import { ref } from 'vue';

import { parseVodFile, type VodFile } from '@/vodFile';

import VodPlayer from '@/components/VodPlayer.vue';

const TEST_VOD_FILE_URL = 'test_vod.txt';
const vodFile = ref(null as VodFile | null);

async function loadVod(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const text = await response.text();
        const newVodFile = parseVodFile(text);
        if (!newVodFile) {
            throw new Error(`Failed to parse VOD file ${url}`);
        }

        vodFile.value = newVodFile;
    } catch (error) {
        // TODO: Show error in the UI
        console.error(error);
    }
}
loadVod(TEST_VOD_FILE_URL);
</script>

<template>
    <VodPlayer :vod-file />
</template>

<style scoped>
</style>
