<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue';

import type { Moment } from '@/vodFile';

import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState } from '@/components/YoutubePlayer.vue';

const defaultState = {
    running: false,
    tickTimeout: null as number | null,
    time: 0,
    timeline: [] as Moment[],
    currentMoment: null as Moment | null,
    lastSyncTime: null as number | null,
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
}

function play() {
    if (!vodPlayer.value) {
        return;
    }

    state.running = true;
    vodPlayer.value.play();
}

function pause() {
    if (!vodPlayer.value) {
        return;
    }

    state.running = false;
    vodPlayer.value.pause();
}

function stop() {
}
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
            video-id="Q3Kvu6Kgp88"
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
            video-id="Q3Kvu6Kgp88"
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

        <!--table>
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
                    v-for="moment in timeline"
                    :class="moment === currentMoment ? 'active' : ''"
                    @click="seek(moment.time, true)">
                    <td x-text="moment.time"></td>
                    <td x-text="moment.secondTime"></td>
                    <td x-text="moment.tag"></td>
                    <td x-text="moment.value"></td>
                </tr>
            </tbody>
        </table-->
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
