<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { parseVodFile, type VodFile } from '@/vodFile';

import VodPlayer from '@/components/VodPlayer.vue';

const TEST_VOD_FILE_URL = '/test_vod.txt';

const route = useRoute();

const vodFileUrl = ref('');
const vodFileUrlLink = computed(() => {
    if (!vodFileUrl.value) {
        return '';
    }

    const encodedUrl = encodeURIComponent(vodFileUrl.value);
    return `${window.location.origin}${route.path}?load=${encodedUrl}`;
});

watch(() => route.query, (query, oldQuery) => {
    const { load } = query;
    if (load && load !== oldQuery?.load) {
        loadVodFromUrl(load as string);
    }
}, { immediate: true });

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

const vodFile = ref(null as VodFile | null);
const vodFileInput = useTemplateRef<HTMLInputElement>('vodFileInput');

function setVodFile(newVodFile: VodFile) {
    vodFile.value = {
        ...newVodFile,
        vodVideoId: (route.query.vodVideoId as string | undefined) ?? newVodFile.vodVideoId,
    };
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
    <div class="vod-selector" v-show="!vodFile">
        <h2 class="vod-file-label">
            Select VOD file to watch
        </h2>
        <div class="vod-file-input-container">
            <input
                ref="vodFileInput"
                class="visually-hidden"
                type="file"
                id="vodFile"
                name="vodFile"
                @change="loadVodFromFile"
            />
            <button class="button" ype="button" @click="vodFileInput?.click?.()">Select VOD file</button>
        </div>
        <p>(No drag & drop yet)</p>

        <form class="url-form" @submit.prevent="loadVodFromUrl(vodFileUrl)">
            <div class="vod-url-row">
                <label for="vodFileUrl">From URL</label>
                <input v-model="vodFileUrl" type="text" id="vodFileUrl" placeholder="VOD URL" />
            </div>
            <button class="button url-form-submit-button" type="submit" :disabled="!vodFileUrl">Watch from URL</button>
            <div class="vod-url-link">{{ vodFileUrlLink }}</div>
        </form>

        <button v-if="false" @click="loadVodFromUrl(TEST_VOD_FILE_URL)" type="button">Load test VOD</button>
    </div>
    <VodPlayer v-if="vodFile" :vod-file />
</template>

<style scoped>
.vod-selector {
    max-width: 600px;
    margin: calc(var(--top-nav-height) + 5rem) auto 0;

    p {
        margin-top: 0.5rem;
        text-align: center;
    }
}

.vod-file-input-container {
    display: flex;
    margin-top: 1.5rem;
    padding: 4rem;

    align-items: center;
    justify-content: center;

    border-radius: 1rem;
    border: .1875rem dashed rgb(16, 16, 16);
    background-color: var(--color-background-mute);
}

.url-form {
    display: flex;
    margin-top: 3.5rem;
    flex-direction: column;
    grid-template-columns: auto auto;
    gap: 1.5rem;
    padding: 0.5rem;
    align-items: center;

    .vod-url-row {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100%;
        align-items: center;

        input {
            margin-left: 1rem;
        }
    }

    .vod-url-link {
        margin-top: 0.5rem;
    }
}
</style>
