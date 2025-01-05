<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import { parseVodFile, type VodFile } from '@/vodFile';

import VodPlayer from '@/components/VodPlayer.vue';

const TEST_VOD_FILE_URL = 'test_vod.txt';
const vodFile = ref(null as VodFile | null);

const vodFileInput = useTemplateRef<HTMLInputElement>('vodFileInput');

async function loadVodFromUrl(url: string) {
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

async function loadVodFromFile() {
    if (!vodFileInput.value?.files?.length) {
        return;
    }
    const file = vodFileInput.value.files[0];

    const contents: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.addEventListener('error', reject);
        reader.readAsText(file);
    });

    const newVodFile = parseVodFile(contents);
    if (!newVodFile) {
        throw new Error(`Failed to parse VOD file ${file.name}`);
    }

    vodFile.value = newVodFile;
}
</script>

<template>
    <div v-show="vodFile === null">
        <label for="vodFile">VOD file selector</label>
        <input ref="vodFileInput" type="file" id="vodFile" name="vodFile" @change="loadVodFromFile" />
        <button @click="loadVodFromUrl(TEST_VOD_FILE_URL)" type="button">Load test VOD</button>
    </div>
    <VodPlayer v-show="vodFile" :vod-file />
</template>

<style scoped>
</style>
