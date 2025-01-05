<script setup lang="ts">
import { reactive, ref, useTemplateRef, watch } from 'vue';

import { MomentTag } from '@/vodFile';
import type { Moment, VodFile } from '@/vodFile';

import IframeContainer from '@/components/IframeContainer.vue';
import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState } from '@/components/YoutubePlayer.vue';

const TICK_DELAY_MS = 10;
const PLAYBACK_SYNC_TOLERANCE_S = 0.5;
const PLAYBACK_SYNC_TIMEOUT_MS = 2000;

const props = defineProps<{
    vodFile: VodFile | null,
}>();

const defaultState = {
    running: false,
    tickTimeout: null           as number | null,
    time: 0,
    currentMoment: null         as Moment | null,
    currentMomentIndex: null    as number | null,
    lastSyncTime: null          as number | null,
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

function tick(wasSeeking?: boolean) {
    if (!ready.value) {
        return;
    }

    try {
        if (!wasSeeking) {
            state.time = vodPlayer.value?.getCurrentTime?.() ?? 0;
        }

        if (!props.vodFile) {
            return;
        }

        const momentIndex = getMomentIndex(props.vodFile.timeline, state.time);
        const moment = momentIndex !== null ? props.vodFile.timeline[momentIndex] : null;
        if (moment !== state.currentMoment) {
            switch (moment?.tag) {
                case MomentTag.Seek:
                case MomentTag.Play:
                case MomentTag.Pause:
                    if (secondPlayerState.value !== PlayerState.Unstarted && secondPlayerState.value !== PlayerState.Cued) {
                        secondPlayer.value!.seekTo(moment.secondTime);
                    }
                    break;
                default:
                    break;
            }

            state.currentMoment = moment;
            state.currentMomentIndex = momentIndex;
        }

        if (!moment) {
            return;
        }

        const secondVideoExpectedTime = getSecondVideoTime(state.time, moment);
        const secondVideoDuration = secondPlayer.value!.getDuration();
        const secondVideoCurrentTime = secondPlayer.value!.getCurrentTime();
        if (secondVideoDuration && secondVideoExpectedTime > secondVideoDuration) {
            if (secondPlayerState.value === PlayerState.Playing || secondPlayerState.value === PlayerState.Buffering) {
                secondPlayer.value!.pause();
            }
            if (secondVideoCurrentTime !== secondVideoDuration) {
                secondPlayer.value!.seekTo(secondVideoDuration);
            }
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

        if (Math.abs(secondVideoExpectedTime - secondVideoCurrentTime) > PLAYBACK_SYNC_TOLERANCE_S) {
            const now = Date.now();
            if (!state.lastSyncTime || now - state.lastSyncTime > PLAYBACK_SYNC_TIMEOUT_MS) {
                secondPlayer.value!.seekTo(secondVideoExpectedTime);
                state.lastSyncTime = now;
            }
        }
    } finally {
        if (state.running) {
            state.tickTimeout = setTimeout(tick, TICK_DELAY_MS);
        }
    }
}

function getSecondVideoTime(currentTime: number, moment: Moment) {
    const { time, secondTime, playing } = moment;
    return secondTime + (playing ? currentTime - time : 0);
}

function getMomentIndex(timeline: Moment[], time: number) {
    let momentIndex = state.currentMomentIndex;
    if (momentIndex !== null && (momentIndex >= timeline.length || timeline[momentIndex].time > time)) {
        momentIndex = null;
    }

    while (true) {
        const nextMomentIndex = momentIndex !== null ? momentIndex + 1 : 0;
        if (nextMomentIndex >= timeline.length) {
            break;
        }

        const nextMoment = timeline[nextMomentIndex];
        if (nextMoment.time > time) {
            break;
        }

        momentIndex = nextMomentIndex;
    }

    return momentIndex;
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
    state.currentMomentIndex = null;
    state.time = 0;
    vodPlayer.value!.stop();
    secondPlayer.value!.stop();
}

async function seek(time: number) {
    if (!ready.value) {
        return;
    }

    if (vodPlayerState.value === PlayerState.Cued) {
        vodPlayer.value!.play();
    }

    state.time = time;
    vodPlayer.value!.seekTo(time);

    if (!state.running) {
        vodPlayer.value!.pause();
    }

    if (state.tickTimeout) {
        clearTimeout(state.tickTimeout);
        state.tickTimeout = null;
    }
    tick(true);
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

watch(() => props.vodFile, () => {
    if (state.running) {
        vodPlayer.value?.stop?.();
        secondPlayer.value?.stop?.();
    }

    Object.assign(state, defaultState);
});
</script>

<template>
    <div class="container">
        <IframeContainer v-slot="{ size }">
            <YoutubePlayer
                ref="vod-player"
                element-id="vod-player"
                v-model:state="vodPlayerState"
                @ready="onReady"
                :width="size.width"
                :height="size.height"
                :video-id="vodFile?.vodVideoId ?? null" />
        </IframeContainer>
        <IframeContainer v-slot="{ size }">
            <YoutubePlayer
                ref="second-player"
                element-id="second-player"
                v-model:state="secondPlayerState"
                @ready="onReady"
                :width="size.width"
                :height="size.height"
                :video-id="state.currentMoment?.videoId ?? null" />
        </IframeContainer>

        <div v-if="false" class="debug">
            <div class="debug-controls" :class="!!ready || 'not-ready'">
                <button v-show="!state.running" @click="play" type="button">Play</button>
                <button v-show="state.running" @click="pause" type="button">Pause</button>
                <button :disabled="state.time === 0" @click="stop" type="button">Stop</button>
                <div>
                    Time {{ state.time }}
                </div>
                <div :class="{
                    active: vodPlayerState === PlayerState.Playing,
                    buffering: vodPlayerState === PlayerState.Buffering,
                }">
                    VOD player state {{ PlayerState[vodPlayerState] }}
                </div>
                <div :class="{
                    active: secondPlayerState === PlayerState.Playing,
                    buffering: secondPlayerState === PlayerState.Buffering,
                }">
                    2nd player state {{ PlayerState[secondPlayerState] }}
                </div>
            </div>

            <table class="debug-timeline">
                <thead>
                    <tr>
                        <th scope="col">VOD Time</th>
                        <th scope="col">2nd Video Time</th>
                        <th scope="col">Event Tag</th>
                        <th scope="col">Event Argument</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="moment in vodFile?.timeline ?? []"
                        :key="moment.time"
                        :class="moment === state.currentMoment ? 'active' : ''"
                        @click="seek(moment.time)">
                        <td>{{ moment.time }}</td>
                        <td>{{ moment.secondTime }}</td>
                        <td>{{ moment.tag }}</td>
                        <td>{{ moment.argument }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.container {
    display: grid;
    width: 100vw;
    height: 100vh;

    padding: .75rem;
    grid-gap: .75rem;

    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: 1fr;

    align-items: center;
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
