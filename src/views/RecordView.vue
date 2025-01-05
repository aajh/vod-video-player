<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';

import { createFilenameTimestamp, MomentTag, saveToDisk, VOD_FILE_TEMPLATE } from '@/vodFile';

import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState, getVideoIdFromUrl } from '@/components/YoutubePlayer.vue';

const RECORING_SYNC_INTERVAL_MS = 5000;

const player = useTemplateRef<typeof YoutubePlayer>('player');
const playerState = ref(PlayerState.Unstarted);

const isRecording = ref(false);
let recordingStart = 0;
let syncIntervalId = 0;

const videoId = ref<string | null>(null);

interface RecordedMoment {
    time: number,
    tag: MomentTag,
    argument?: string | number,
}
const recording = ref([] as RecordedMoment[]);
const latestMoments = computed(() => {
    const latest = recording.value.slice(-10);
    return latest.reverse();
});

watch(playerState, (state, oldState) => {
    if (!player.value || !isRecording.value) {
        return;
    }

    const playerTimeMs = Math.round(player.value.getCurrentTime() * 1000);
    if (state === PlayerState.Playing) {
        recordMoment(MomentTag.Play, playerTimeMs);
    } else if (oldState === PlayerState.Playing) {
        recordMoment(MomentTag.Pause, playerTimeMs);
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

function onSync() {
    if (!player.value || !isRecording.value) {
        if (syncIntervalId) {
            clearInterval(syncIntervalId);
            syncIntervalId = 0;
        }
        return;
    }

    if (recording.value.length === 0) {
        return;
    }

    const playerTimeMs = Math.round(player.value.getCurrentTime() * 1000);
    const latestMoment = recording.value[recording.value.length - 1];
    if (latestMoment?.tag !== MomentTag.Sync || latestMoment.argument !== playerTimeMs) {
        recordMoment(MomentTag.Sync, playerTimeMs);
    }
}

function start() {
    if (!player.value) {
        return;
    }

    isRecording.value = true;
    recordingStart = Date.now();

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

    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    syncIntervalId = setInterval(onSync, RECORING_SYNC_INTERVAL_MS);
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
    const newVideoIdEntry = formData.get('videoId');
    if (!newVideoIdEntry) {
        return;
    }

    const newVideoId = newVideoIdEntry as string;
    videoId.value = getVideoIdFromUrl(newVideoId) ?? newVideoId;
}

function save() {
    let file = VOD_FILE_TEMPLATE;

    for (const m of recording.value) {
        const argument = m.argument !== undefined ? ` ${String(m.argument)}` : '';
        const line = `${m.time} ${m.tag}${argument}\n`;
        file = file.concat(line);
    }

    const filename = `vod_recording_${createFilenameTimestamp()}.txt`;
    saveToDisk(filename, file);
}

function recordMoment(tag: MomentTag, argument?: RecordedMoment['argument']) {
    if (!player.value || !isRecording.value) {
        return;
    }

    recording.value.push({
        time: Date.now() - recordingStart,
        tag,
        argument,
    });
}
</script>

<template>
    <div class="container">
        <form @submit.prevent="changeVideo">
            <label for="videoId">Youtube video ID</label>
            <input type="text" id="videoId" name="videoId" />
            <button type="submit">Change video</button>
        </form>

        <div class="controls" :class="!!player || 'not-ready'">
            <button v-show="!isRecording && !recording.length" @click="start" type="button">Start</button>
            <button v-show="isRecording" @click="stop" type="button">Stop</button>
            <button v-show="!isRecording && recording.length" @click="save" type="button">Save</button>
        </div>

        <div ref="player-container" class="player-container">
            <YoutubePlayer
                ref="player"
                element-id="player"
                v-model:state="playerState"
                @seek="onSeek"
                :video-id
                :width="640"
                :height="390"
            />
        </div>


        <div v-if="false">
            <div :class="{
                active: playerState === PlayerState.Playing,
                buffering: playerState === PlayerState.Buffering,
            }">
                2nd player state {{ PlayerState[playerState] }}
            </div>
            <div>
                Current video ID {{videoId}}
            </div>
        </div>

        <table v-if="false">
            <thead>
                <tr>
                    <th scope="col">VOD Time</th>
                    <th scope="col">2nd Video Time</th>
                    <th scope="col">Event Tag</th>
                    <th scope="col">Event Argument</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="moment in latestMoments" :key="moment.time">
                    <td>{{moment.time}}</td>
                    <td>{{moment.tag}}</td>
                    <td>{{moment.argument}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.container {
    display: grid;
    width: 100vw;
    height: 100vh;

    padding: .75rem;
    grid-gap: .75rem;

    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;

    align-items: center;
}

.player-container {
    display: grid;
    grid-template: 100% / 100%;
    aspect-ratio: 16 / 9;
    width: 100%;
}

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
