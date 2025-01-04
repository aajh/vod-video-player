<script lang="ts">
export enum PlayerState {
    Unstarted = -1,
    Ended = 0,
    Playing = 1,
    Paused = 2,
    Buffering = 3,
    Cued = 5,
};

const YOUTUBE_IFRAME_API_URL =  'https://www.youtube.com/iframe_api';
const youtubeIframeApiPromise: Promise<void> = new Promise(resolve => {
    if (window.YT) {
        resolve();
        return;
    }

    const oldOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
        resolve();
        if (typeof oldOnReady === 'function') {
            oldOnReady();
        }
    }

    const tag = document.createElement('script');
    tag.src = YOUTUBE_IFRAME_API_URL;

    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
        document.append(tag);
    }
});
</script>
<script setup lang="ts">
import { onMounted, watch } from 'vue';

const props = withDefaults(defineProps<{
    elementId: string,
    width: number,
    height: number,
    videoId: string | null,
    playerVars?: YT.PlayerVars,
}>(), {
    playerVars: () => ({
        playsinline: 1,
    }),
});

const state = defineModel<PlayerState>('state', { default: PlayerState.Unstarted });

const emit = defineEmits<{
    (e: 'ready'): void,
}>();

defineExpose({
    ready() {
        return !!player;
    },
    getCurrentTime() {
        if (!player) {
            return 0;
        }

        return player.getCurrentTime();
    },
    play() {
        if (!player) {
            return;
        }

        player.playVideo();
    },
    pause() {
        if (!player) {
            return;
        }

        player.pauseVideo();
    },
    stop() {
        if (!player) {
            return;
        }

        player.stopVideo();
    },
    seekTo(time: number) {
        if (!player) {
            return;
        }

        player.seekTo(time, true);
    },
});

const theElementId = props.elementId;

let player: YT.Player | null = null;
let videoIdToBeQueued: string | null = null;
onMounted(async () => {
    await youtubeIframeApiPromise;

    const p = new YT.Player(props.elementId, {
        height: props.height,
        width: props.width,
        playerVars: {
            playsinline: 1,
        },
        events: {
            onReady: () => {
                player = p;
                if (videoIdToBeQueued) {
                    player.cueVideoById(videoIdToBeQueued);
                }
                emit('ready');
            },
            onStateChange: e => {
                state.value = e.data as unknown as PlayerState;
            },
        },
    });
});

watch(() => props.videoId, (newVideoId, oldVideoId) => {
    if (newVideoId === oldVideoId) {
        return;
    }

    if (player) {
        if (newVideoId) {
            player.cueVideoById(newVideoId);
        } else {
            player.stopVideo();
        }
    } else {
        videoIdToBeQueued = newVideoId;
    }
}, {
    immediate: true,
});
</script>

<template>
    <div :id="theElementId"></div>
</template>
