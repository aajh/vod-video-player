<script setup lang="ts">
import { reactive, ref, useTemplateRef, watch } from 'vue';

import { MomentTag, parseVodFile } from '@/vodFile';
import type { Moment, VodFile } from '@/vodFile';

import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState } from '@/components/YoutubePlayer.vue';

const TICK_DELAY_MS = 10;
const PLAYBACK_SYNC_TOLERANCE_S = 0.5;
const PLAYBACK_SYNC_TIMEOUT_MS = 2000;

const TEST_VOD_FILE_URL = 'test_vod.txt';

const defaultState = {
    running: false,
    tickTimeout: null   as number | null,
    time: 0,
    vodFile: null       as VodFile | null,
    currentMoment: null as Moment | null,
    lastSyncTime: null  as number | null,
};
const state = reactive(Object.assign({}, defaultState));

const ready = ref(false);

const vodPlayer = useTemplateRef<typeof YoutubePlayer>('vod-player');
const vodPlayerState = ref(PlayerState.Unstarted);

const secondPlayer = useTemplateRef<typeof YoutubePlayer>('second-player');
const secondPlayerState = ref(PlayerState.Unstarted);

function onReady() {
    if (ready.value) {
        return;
    }
    if (!vodPlayer.value?.ready?.() || !secondPlayer.value?.ready?.()) {
        return;
    }

    ready.value = true;
    loadVod(TEST_VOD_FILE_URL);
}

function tick() {
    if (!ready.value) {
        return;
    }

    state.time = vodPlayer.value!.getCurrentTime();

    if (!state.vodFile) {
        // TODO
        return;
    }

    const moment = getMoment(state.vodFile.timeline, state.time);
    if (moment !== state.currentMoment) {
        switch (moment?.tag) {
            case MomentTag.Seek:
                secondPlayer.value!.seekTo(moment.value);
                break;
            case MomentTag.Stop:
                stop();
                break;
            default:
                break;
        }

        state.currentMoment = moment;
    }

    if (!moment) {
        // TODO
        return;
    }

    const isSecondVideoPlaying = secondPlayerState.value === PlayerState.Playing;
    if (state.running && moment.playing) {
        if (!isSecondVideoPlaying) {
            secondPlayer.value!.play();
        }
    } else if (isSecondVideoPlaying) {
        secondPlayer.value!.pause();
    }

    if (vodPlayerState.value === PlayerState.Buffering && isSecondVideoPlaying) {
        secondPlayer.value!.pause();
    }

    const secondVideoExpectedTime = getSecondVideoTime(state.time, moment);
    const secondVideoCurrentTime = secondPlayer.value!.getCurrentTime();
    if (Math.abs(secondVideoExpectedTime - secondVideoCurrentTime) > PLAYBACK_SYNC_TOLERANCE_S) {
        const now = Date.now();
        if (!state.lastSyncTime || now - state.lastSyncTime > PLAYBACK_SYNC_TIMEOUT_MS) {
            secondPlayer.value!.seekTo(secondVideoExpectedTime);
            state.lastSyncTime = now;
        }
    }

    if (state.running) {
        state.tickTimeout = setTimeout(tick, TICK_DELAY_MS);
    }
}

function getSecondVideoTime(currentTime: number, moment: Moment) {
    const { time, secondTime, playing } = moment;
    return secondTime + (playing ? currentTime - time : 0);
}

function getMoment(timeline: Moment[], time: number) {
    let moment = null;
    for (const m of timeline) {
        if (m.time > time) {
            break;
        }

        moment = m;
    }

    return moment;
}

function play() {
    if (!ready.value) {
        return;
    }

    state.running = true;
    vodPlayer.value!.play();

    if (state.tickTimeout) {
        clearTimeout(state.tickTimeout);
        state.tickTimeout = null;
    }
    tick();
}

function pause() {
    if (!ready.value) {
        return;
    }

    state.running = false;
    vodPlayer.value!.pause();
    secondPlayer.value!.pause();
    if (state.tickTimeout) {
        clearTimeout(state.tickTimeout);
        state.tickTimeout = null;
    }
}

function stop() {
    if (!ready.value) {
        return;
    }

    pause();
    state.currentMoment = null;
    state.time = 0;
    vodPlayer.value!.stop();
    secondPlayer.value!.stop();
    // TODO
    //this.secondPlayer.videoId = null;
}

function seek(time: number, shouldPlay = false) {
    if (!ready.value) {
        return;
    }

    console.log('seek', time);

    if (vodPlayerState.value === PlayerState.Cued) {
        vodPlayer.value!.play();
    }

    state.time = time;
    vodPlayer.value!.seekTo(time);

    if (!state.running) {
        vodPlayer.value!.pause();
    }

    if (shouldPlay) {
        play();
    } else {
        if (state.tickTimeout) {
            clearTimeout(state.tickTimeout);
            state.tickTimeout = null;
        }
        tick();
    }
}

async function loadVod(url: string) {
    if (!ready.value) {
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const text = await response.text();
        const vodFile = parseVodFile(text);
        if (!vodFile) {
            throw new Error(`Failed to parse VOD file ${url}`);
        }

        Object.assign(state, defaultState);
        state.vodFile = vodFile;
    } catch (error) {
        // TODO: Show error in the UI
        console.error(error);
    }
}

watch(vodPlayerState, newState => {
    switch (newState) {
        case PlayerState.Playing:
            play();
            break;
        case PlayerState.Paused:
            pause();
            break;
    }
});
</script>

<template>
    <div>
        <YoutubePlayer
            ref="vod-player"
            element-id="vod-player"
            v-model:state="vodPlayerState"
            @ready="onReady"
            :width="320"
            :height="195"
            :video-id="state.vodFile?.vodId ?? null"
        />
        <YoutubePlayer
            ref="second-player"
            element-id="second-player"
            v-model:state="secondPlayerState"
            @ready="onReady"
            :width="320"
            :height="195"
            :player-vars="{
                playsinline: 1,
                controls: 0,
                disablekb: 1,
            }"
            :video-id="state.currentMoment?.videoId ?? null"
        />
        <div id="controls" :class="ready || 'not-ready'">
            <button v-show="!state.running" type="button" @click="play">Play</button>
            <button v-show="state.running" type="button" @click="pause">Pause</button>
            <button :disabled="state.time === 0" type="button" @click="stop">Stop</button>
            <div>
                Time {{state.time}}
            </div>
            <div :class="{
                active: vodPlayerState === PlayerState.Playing,
                buffering: vodPlayerState === PlayerState.Buffering,
            }">
                VOD player state {{PlayerState[vodPlayerState]}}
            </div>
            <div :class="{
                active: secondPlayerState === PlayerState.Playing,
                buffering: secondPlayerState === PlayerState.Buffering,
            }">
                2nd player state {{PlayerState[secondPlayerState]}}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th scope="col">VOD Time</th>
                    <th scope="col">2nd Video Time</th>
                    <th scope="col">Event Tag</th>
                    <th scope="col">Event Value</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="moment in state.vodFile?.timeline ?? []"
                    :key="moment.time"
                    :class="moment === state.currentMoment ? 'active' : ''"
                    @click="seek(moment.time, true)">
                    <td>{{moment.time}}</td>
                    <td>{{moment.secondTime}}</td>
                    <td>{{moment.tag}}</td>
                    <td>{{moment.value}}</td>
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
