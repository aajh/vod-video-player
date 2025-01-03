<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState } from '@/components/YoutubePlayer.vue';

const recording = ref(false);
const videoId = ref<string | null>(null);

const secondPlayer = useTemplateRef<typeof YoutubePlayer>('second-player');
const secondPlayerState = ref(PlayerState.Unstarted);

function start() {
    if (!secondPlayer.value) {
        return;
    }

    recording.value = true;
}

function stop() {
    if (!secondPlayer.value) {
        return;
    }

    recording.value = false;
    secondPlayer.value.pause();
}

function changeVideo(event: Event) {
    if (!event.target) {
        return;
    }

    const formData = new FormData(event.target as HTMLFormElement);
    const newVideoId = formData.get('videoId');
    if (!newVideoId) {
        return;
    }

    videoId.value = newVideoId as string;
}
</script>

<template>
    <div>
        <form @submit.prevent="changeVideo">
            <label for="videoId">Youtube video ID</label>
            <input type="text" id="videoId" name="videoId" />
            <button type="submit">Change video</button>
        </form>
        <div>
            Current video ID {{videoId}}
        </div>

        <YoutubePlayer
            ref="second-player"
            element-id="second-player"
            v-model:state="secondPlayerState"
            :video-id
            :width="320"
            :height="195"
        />
        <button v-show="!recording" type="button" @click="start">Start</button>
        <button v-show="recording" type="button" @click="stop">Stop</button>
        <div :class="{
            active: secondPlayerState === PlayerState.Playing,
            buffering: secondPlayerState === PlayerState.Buffering,
        }">
            2nd player state {{PlayerState[secondPlayerState]}}
        </div>
    </div>
</template>

<style scoped>
.active {
    background-color: rgb(142, 251, 142);
}

.buffering {
    background-color: rgb(255, 255, 96);
}
</style>
