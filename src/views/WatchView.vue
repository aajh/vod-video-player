<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState } from '@/components/YoutubePlayer.vue';

const running = ref(false);

const vodPlayer = useTemplateRef<typeof YoutubePlayer>('vod-player');
const vodPlayerState = ref(PlayerState.Unstarted);
const vodPlayerPlaying = computed(() => vodPlayerState.value === PlayerState.Playing);

function play() {
    if (!vodPlayer.value) {
        return;
    }

    running.value = true;
    vodPlayer.value.play();
}

function pause() {
    if (!vodPlayer.value) {
        return;
    }

    running.value = false;
    vodPlayer.value.pause();
}
</script>

<template>
    <div>
        <h1>This is the watch page</h1>
        <YoutubePlayer
            ref="vod-player"
            v-model:state="vodPlayerState"
            element-id="vod-player"
            :width="320"
            :height="195"
            video-id="Q3Kvu6Kgp88"
        />
        <button v-show="!running" type="button" @click="play">Play</button>
        <button v-show="running" type="button" @click="pause">Pause</button>
        <div>
            VOD player state {{PlayerState[vodPlayerState]}} {{vodPlayerPlaying}}
        </div>
    </div>
</template>

<style scoped>
</style>
