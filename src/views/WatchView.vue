<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import { useDebug } from '@/misc';
import { ParseError, parseVodFile, type VodFile } from '@/vodFile';

import Navigation from '@/components/Navigation.vue';
import VodPlayer from '@/components/VodPlayer.vue';

const TEST_VOD_FILE_URL = '/test_vod.txt';

const debug = useDebug();
const route = useRoute();

const loadErrorMessage = ref('');
const loadErrorDetail = ref('');
function setLoadErrorMessage(error: unknown) {
        console.error(error);
        loadErrorMessage.value = error instanceof ParseError
            ? 'Error while parsing the VOD file'
            : 'Error while loading the VOD file';
        loadErrorDetail.value = error instanceof Error ? error.message : String(error);
}

const vodFileUrl = ref('');
const vodFileUrlLink = computed(() => {
    if (!vodFileUrl.value) {
        return '';
    }

    const encodedUrl = encodeURIComponent(vodFileUrl.value);
    return `${window.location.origin}${route.path}?load=${encodedUrl}`;
});

onMounted(() => {
    const { load } = route.query;
    if (load) {
        loadVodFromUrl(load as string);
    }
});

async function loadVodFromUrl(url: string) {
    try {
        vodFile.value = null;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const text = await response.text();
        const timeOffset = route.query.timeOffset ? parseInt(route.query.timeOffset as string, 10) / 1000 : undefined;
        const newVodFile = parseVodFile(text, {
            filename: url,
            timeOffsetOverrideSeconds: timeOffset,
        });

        setVodFile(newVodFile);
    } catch (error) {
        setLoadErrorMessage(error);
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

async function loadVodFromFile(file: File) {
    vodFile.value = null;

    const contents: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.addEventListener('error', reject);
        reader.readAsText(file);
    });

    const timeOffset = route.query.timeOffset ? parseInt(route.query.timeOffset as string, 10) / 1000 : undefined;
    const newVodFile = parseVodFile(contents, {
        filename: file.name,
        timeOffsetOverrideSeconds: timeOffset,
    });

    setVodFile(newVodFile);
}

async function onFileChange() {
    try {
        if (!vodFileInput.value?.files?.length) {
            return;
        }

        const file = vodFileInput.value.files[0];
        await loadVodFromFile(file);
    } catch (error) {
        setLoadErrorMessage(error);
    }
}

const dragHover = ref(false);

async function onDrop(event: DragEvent) {
    try {
        dragHover.value = false;
        const file = event.dataTransfer?.files?.[0];
        if (file) {
            await loadVodFromFile(file);
        }
    } catch (error) {
        setLoadErrorMessage(error);
    }
}
</script>

<template>
    <Navigation />

    <div class="vod-selector" v-show="!vodFile && !route.query.load">
        <h2 class="vod-file-label">
            Select VOD file to watch
        </h2>
        <div
            class="vod-file-input-container"
            :class="dragHover && 'drag-hover'"
            @click="vodFileInput?.click?.()"
            @drop.prevent="onDrop"
            @dragenter="dragHover = true"
            @dragleave="dragHover = false"
            @dragover.prevent>
            <input
                ref="vodFileInput"
                class="visually-hidden"
                type="file"
                id="vodFile"
                name="vodFile"
                @change="onFileChange" />
            <button class="button" type="button" @click.stop="vodFileInput?.click?.()">
                Select VOD file
            </button>
        </div>

        <form class="url-form" @submit.prevent="loadVodFromUrl(vodFileUrl)">
            <div class="vod-url-row">
                <label for="vodFileUrl">From URL</label>
                <input v-model="vodFileUrl" type="text" id="vodFileUrl" placeholder="VOD URL" />
            </div>
            <button class="button url-form-submit-button" type="submit" :disabled="!vodFileUrl">Watch from URL</button>
            <div class="vod-url-link">{{ vodFileUrlLink }}</div>
        </form>

        <button v-if="debug" @click="loadVodFromUrl(TEST_VOD_FILE_URL)" type="button">Load test VOD</button>

        <div class="error-container" v-show="loadErrorMessage">
            <div class="error-message">
                <p>{{ loadErrorMessage }}</p>
                <p class="error-message-detail">{{ loadErrorDetail }}</p>
            </div>
            <button class="error-close-button" type="button" @click="loadErrorMessage = ''">
                <span>&#x00D7;</span>
            </button>
        </div>
    </div>
    <VodPlayer v-if="vodFile" :vod-file />
</template>

<style scoped>
.vod-selector {
    max-width: 600px;
    margin: 5rem auto 0;
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

    &.drag-hover {
        background-color: hsl(160, 100%, 28%);
    }
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

.error-container {
    display: grid;

    margin-top: 1rem;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 1fr;

    background-color: var(--color-error);
    color: var(--color-error-text);
    border-radius: 0.875rem;
}

.error-close-button {
    --button-size: 2rem;

    display: grid;
    grid-area: 1 / 2;
    justify-content: center;
    align-content: center;
    width: var(--button-size);
    height: var(--button-size);
    margin: 0.375rem;

    background-color: var(--color-error-button);
    color: var(--color-error-button-text);
    border: none;
    border-radius: 50%;
    cursor: pointer;

    &:hover {
        background-color: var(--color-error-button-hover);
    }
    &:active {
        background-color: var(--color-error-button-active);
    }

    span {
        margin-top: -0.125rem;
        font-size: 1.375rem;
        font-weight: 600;
    }
}

.error-message {
    grid-column: 1 / span 2;
    grid-row: 1 / span 2;

    padding: 2.5rem;
    text-align: center;

    font-size: 1.375rem;
    font-weight: 600;
}

.error-message-detail {
    margin-top: 0.5rem;
    font-size: 0.875rem;
}
</style>
