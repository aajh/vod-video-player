<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue';

import { useDebug } from '@/misc';
import { MomentTag } from '@/vodFile';
import type { Moment, VodFile } from '@/vodFile';

import IframeContainer from '@/components/IframeContainer.vue';
import YoutubePlayer from '@/components/YoutubePlayer.vue';
import { PlayerState } from '@/components/YoutubePlayer.vue';

const TICK_DELAY_MS = 8;
const PLAYBACK_SYNC_TOLERANCE_S = 0.5;
const PLAYBACK_SYNC_TIMEOUT_MS = 2000;

const debug = useDebug();

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

onMounted(() => {
    tick();
});

onUnmounted(() => {
    if (state.tickTimeout) {
        clearTimeout(state.tickTimeout);
        state.tickTimeout = 0;
    }
});

function tick(wasSeeking?: boolean) {
    try {
        if (!ready.value || !vodPlayer.value || !secondPlayer.value) {
            return;
        }

        if (!wasSeeking) {
            state.time = vodPlayer.value.getCurrentTime();
        }

        if (!props.vodFile) {
            return;
        }

        const momentIndex = getMomentIndex(props.vodFile.timeline, state.time);
        const moment = momentIndex !== null ? props.vodFile.timeline[momentIndex] : null;
        const isNewMoment = moment !== state.currentMoment;
        if (isNewMoment) {
            state.currentMoment = moment;
            state.currentMomentIndex = momentIndex;
        }
        if (!moment) {
            return;
        }

        const secondVideoExpectedTime = getSecondVideoTime(state.time, moment);
        const secondVideoCurrentTime = secondPlayer.value.getCurrentTime();

        if (!state.running && moment.videoId) {
            const s = secondPlayerState.value;
            if ((s === PlayerState.Cued || s === PlayerState.Unstarted) && secondVideoExpectedTime) {
                secondPlayer.value.play();
                secondPlayer.value.pause();
            }
            if (s !== PlayerState.Ended && s !== PlayerState.Cued) {
                if (Math.abs(secondVideoCurrentTime - secondVideoExpectedTime) > TICK_DELAY_MS / 1000) {
                    secondPlayer.value.seekTo(secondVideoExpectedTime);
                }
            }
            return;
        }

        if (!secondPlayer.value.getVideoId() || secondPlayerState.value === PlayerState.Ended) {
            return;
        }

        if (isNewMoment) {
            switch (moment?.tag) {
                case MomentTag.Seek:
                case MomentTag.Play:
                case MomentTag.Pause:
                    if (moment.playing) {
                        secondPlayer.value.play();
                    } else {
                        secondPlayer.value.pause();
                    }
                    if (secondPlayerState.value !== PlayerState.Unstarted && secondPlayerState.value !== PlayerState.Cued) {
                        secondPlayer.value.seekTo(secondVideoExpectedTime);
                    }
                    return;
                default:
                    break;
            }
        }

        const isSecondVideoPlaying = secondPlayerState.value === PlayerState.Playing;
        if (moment.playing) {
            if (!isSecondVideoPlaying && secondPlayer.value.getVideoId()) {
                secondPlayer.value.play();
            }
        } else if (isSecondVideoPlaying) {
            secondPlayer.value.pause();
        }

        if (vodPlayerState.value === PlayerState.Buffering && isSecondVideoPlaying) {
            secondPlayer.value.pause();
        }

        if (Math.abs(secondVideoExpectedTime - secondVideoCurrentTime) > PLAYBACK_SYNC_TOLERANCE_S) {
            const now = Date.now();
            if (!state.lastSyncTime || now - state.lastSyncTime > PLAYBACK_SYNC_TIMEOUT_MS) {
                secondPlayer.value.seekTo(secondVideoExpectedTime);
                state.lastSyncTime = now;
            }
        }
    } finally {
        state.tickTimeout = setTimeout(tick, TICK_DELAY_MS);
    }
}

function getSecondVideoTime(currentTime: number, moment: Moment) {
    const { time, secondTime, playing, playbackRate } = moment;
    return secondTime + (playing ? playbackRate * (currentTime - time) : 0);
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
}

async function debugSeek(time: number) {
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
    vodPlayer.value?.stop?.();
    secondPlayer.value?.stop?.();

    Object.assign(state, defaultState);
});


const playerContainer = useTemplateRef('player-container');
const playerContainerWidth = ref(window.innerWidth);

const INITIAL_VOD_PLAYER_SIZE = 0.4;
const RESIZE_BAR_WIDTH = 16;
const vodPlayerWidth = ref(INITIAL_VOD_PLAYER_SIZE * (playerContainerWidth.value - RESIZE_BAR_WIDTH));
const secondPlayerWidth = computed(() => playerContainerWidth.value - RESIZE_BAR_WIDTH - vodPlayerWidth.value);

function onWindowResize() {
    const oldWidth = playerContainerWidth.value;

    const size = playerContainer.value?.getBoundingClientRect();
    playerContainerWidth.value = size ? size.width : window.innerWidth;

    if (playerContainerWidth.value !== oldWidth) {
        vodPlayerWidth.value = playerContainerWidth.value / oldWidth * vodPlayerWidth.value;
    }
}
onWindowResize();
onMounted(() => {
    window.addEventListener('resize', onWindowResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', onWindowResize);
});

const resizing = ref(false);
function startResize() {
    resizing.value = true;
}

function endResize() {
    resizing.value = false;
}

function updateResize(event: MouseEvent) {
    if (resizing.value) {
        vodPlayerWidth.value = event.clientX - RESIZE_BAR_WIDTH / 2;
    }
}
</script>

<template>
    <div
        class="container"
        ref="player-container"
        :class="resizing && 'resizing'"
        @mouseup="endResize"
        @mousemove="updateResize">
        <IframeContainer class="vod-player" :style="{ 'max-width': `${vodPlayerWidth}px` }" v-slot="{ size }">
            <YoutubePlayer
                ref="vod-player"
                element-id="vod-player"
                v-model:state="vodPlayerState"
                @ready="onReady"
                :width="size.width"
                :height="size.height"
                :video-id="vodFile?.vodVideoId ?? null" />
        </IframeContainer>
        <div class="resize-bar" @mousedown="startResize"></div>
        <IframeContainer class="second-player" :style="{ 'max-width': `${secondPlayerWidth}px` }" v-slot="{ size }">
            <YoutubePlayer
                ref="second-player"
                element-id="second-player"
                v-model:state="secondPlayerState"
                @ready="onReady"
                :playback-rate="state.currentMoment?.playbackRate ?? 1"
                :width="size.width"
                :height="size.height"
                :video-id="state.currentMoment?.videoId ?? null" />
        </IframeContainer>

        <div v-if="debug" class="debug">
            <div class="debug-controls">
                <div>
                    Time {{ Math.floor(state.time * 1000) }}
                </div>
                <div>
                    2nd video ID {{ state.currentMoment?.videoId }}
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

            <table v-if="false" class="debug-timeline">
                <thead>
                    <tr>
                        <th scope="col">VOD Time</th>
                        <th scope="col">2nd Video Time</th>
                        <th scope="col">Playback Rate</th>
                        <th scope="col">Event Tag</th>
                        <th scope="col">Event Argument</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="moment in vodFile?.timeline ?? []"
                        :key="moment.time"
                        :class="moment === state.currentMoment ? 'active' : ''"
                        @click="debugSeek(moment.time)">
                        <td>{{ moment.time }}</td>
                        <td>{{ moment.secondTime }}</td>
                        <td>{{ moment.playbackRate }}</td>
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
    height: calc(100vh - var(--toolbar-height));

    grid-template-columns: calc(v-bind(vodPlayerWidth) * 1px) calc(v-bind(RESIZE_BAR_WIDTH) * 1px) calc(v-bind(secondPlayerWidth) * 1px);
    grid-template-rows: 1fr;

    align-items: center;
    justify-items: center;
}

.vod-player, .second-player {
    padding: 0.75rem;

    .resizing & {
        pointer-events: none;
    }
}

.vod-player {
    padding-right: 0;
}

.second-player {
    padding-left: 0;
}

.resize-bar {
    display: grid;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    cursor: col-resize;

    &::before {
        content: "";
        width: 4px;
        height: 16px;
        border-inline: 1px solid var(--color-resize-bar-icon);
    }
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

@media (max-aspect-ratio: 2.6) and (min-width: 800px) {
    .container {
        grid-template-rows: 1fr var(--toolbar-height);
    }
}
</style>
