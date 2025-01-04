<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';

import { MomentTag } from '@/vodFile';

import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState } from '@/components/YoutubePlayer.vue';

const player = useTemplateRef<typeof YoutubePlayer>('player');
const playerState = ref(PlayerState.Unstarted);

const isRecording = ref(false);
const recordingStart = ref(0);

const videoId = ref<string | null>(null);

interface RecordedMoment {
    time: number,
    tag: MomentTag,
    argument?: string | number,
}
const recording = ref([] as RecordedMoment[]);

watch(playerState, (state, oldState) => {
    if (!isRecording.value) {
        return;
    }

    if (state === PlayerState.Playing) {
        recordMoment(MomentTag.Play);
    } else if (oldState === PlayerState.Playing) {
        recordMoment(MomentTag.Pause);
    }
});

watch(videoId, () => {
    if (!isRecording.value) {
        return;
    }

    if (videoId.value) {
        recordMoment(MomentTag.CueVideo, videoId.value);
    }
});

function onSeek() {
    if (!player.value || !isRecording.value) {
        return;
    }

    const playerTimeMs = Math.round(player.value.getCurrentTime() * 1000);
    recordMoment(MomentTag.Seek, playerTimeMs);
}

function start() {
    if (!player.value) {
        return;
    }

    isRecording.value = true;
    recordingStart.value = Date.now();

    recording.value = [];
    if (videoId.value) {
        recordMoment(
            playerState.value === PlayerState.Playing ? MomentTag.LoadVideo : MomentTag.CueVideo,
            videoId.value
        );

        const playerTimeMs = Math.round(player.value.getCurrentTime() * 1000);
        if (playerTimeMs !== 0) {
            recordMoment(MomentTag.Seek, playerTimeMs);
        }
    }
}

function stop() {
    if (!player.value) {
        return;
    }

    isRecording.value = false;
    player.value.pause();
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

function recordMoment(tag: MomentTag, argument?: RecordedMoment['argument']) {
    if (!player.value || !isRecording.value) {
        return;
    }

    recording.value.push({
        time: Date.now() - recordingStart.value,
        tag,
        argument,
    });
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
            ref="player"
            element-id="player"
            v-model:state="playerState"
            @seek="onSeek"
            :video-id
            :width="640"
            :height="390"
        />
        <div id="controls" :class="player || 'not-ready'">
            <button v-show="!isRecording" type="button" @click="start">Start</button>
            <button v-show="isRecording" type="button" @click="stop">Stop</button>
            <div :class="{
                active: playerState === PlayerState.Playing,
                buffering: playerState === PlayerState.Buffering,
            }">
                2nd player state {{PlayerState[playerState]}}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th scope="col">VOD Time</th>
                    <th scope="col">2nd Video Time</th>
                    <th scope="col">Event Tag</th>
                    <th scope="col">Event Argument</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="moment in recording" :key="moment.time">
                    <td>{{moment.time}}</td>
                    <td>{{moment.tag}}</td>
                    <td>{{moment.argument}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.active {
    background-color: rgb(142, 251, 142);
}

.buffering {
    background-color: rgb(255, 255, 96);
}

.not-ready {
    pointer-events: none;
    opacity: 0.4;
}
</style>
