<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { parseVodFile, type VodFile } from '@/vodFile';

import VodPlayer from '@/components/VodPlayer.vue';

const TEST_VOD_FILE_URL = '/test_vod.txt';
const vodFile = ref(null as VodFile | null);
const vodFileInput = useTemplateRef<HTMLInputElement>('vodFileInput');

const route = useRoute();
watch(() => route.query, (query, oldQuery) => {
    const { load } = query;
    if (load && load !== oldQuery?.load) {
        loadVodFromUrl(load as string);
    }
}, { immediate: true });

function setVodFile(newVodFile: VodFile) {
    vodFile.value = {
        ...newVodFile,
        vodVideoId: (route.query.vodVideoId as string | undefined) ?? newVodFile.vodVideoId,
    };
}

async function loadVodFromUrl(url: string) {
    try {
        vodFile.value = null;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const text = await response.text();
        const timeOffset = route.query.timeOffset ? parseInt(route.query.timeOffset as string, 10) / 1000 : undefined;
        const newVodFile = parseVodFile(text, timeOffset);
        if (!newVodFile) {
            throw new Error(`Failed to parse VOD file ${url}`);
        }

        setVodFile(newVodFile);
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
    vodFile.value = null;

    const contents: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.addEventListener('error', reject);
        reader.readAsText(file);
    });

    const timeOffset = route.query.timeOffset ? parseInt(route.query.timeOffset as string, 10) / 1000 : undefined;
    const newVodFile = parseVodFile(contents, timeOffset);
    if (!newVodFile) {
        throw new Error(`Failed to parse VOD file ${file.name}`);
    }

    setVodFile(newVodFile);
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
