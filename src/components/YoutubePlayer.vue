<script lang="ts">
export enum PlayerState {
    Unstarted = -1,
    Ended = 0,
    Playing = 1,
    Paused = 2,
    Buffering = 3,
    Cued = 5,
};

export function getVideoIdFromUrl(url: string | URL) {
    if (typeof url === 'string') {
        try {
            url = new URL(url);
        } catch {
            return null;
        }
    }

    if (url.pathname.includes('/embed/')) {
        const s = url.pathname.split('/');
        return s[s.length - 1];
    }

    return url.searchParams.get('v') ?? null;
}

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

// Note: Cannot detect seeks smaller than the check interval plus slack when not paused
const SEEK_CHECK_INTERVAL_MS = 1000 / 120;
const SEEK_CHECK_SLACK_S = 0.3;
const VIDEO_CHECK_CUE_TIMEOUT_MS = 2000;

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
    (e: 'seek'): void,
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
    getDuration() {
        if (!player) {
            return 0;
        }

        return player.getDuration();
    },
    getVideoId,
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
let lastVideoCueTime = 0;
let lastSeekCheckPlayerTime: number | null = null;
onMounted(async () => {
    await youtubeIframeApiPromise;

    const p = new YT.Player(props.elementId, {
        width: props.width,
        height: props.height,
        playerVars: props.playerVars,
        events: {
            onReady: () => {
                player = p;
                player.setSize(props.width, props.height);
                if (videoIdToBeQueued) {
                    player.cueVideoById(videoIdToBeQueued);
                    playbackRate.value = 1
                }
                if (playbackRateRequest !== null) {
                    player.setPlaybackRate(playbackRateRequest);
                }
                emit('ready');
            },
            onStateChange: e => {
                state.value = e.data as unknown as PlayerState;
            },
            onPlaybackRateChange,
        },
    });

    let lastSeekCheckTime = 0;
    let lastState = PlayerState.Unstarted;
    setInterval(() => {
        if (!player) {
            return;
        }

        const now = Date.now();
        const playerTime = player.getCurrentTime();
        const clockDelta = (now - lastSeekCheckTime) / 1000;
        const videoNotReady = state.value === PlayerState.Unstarted || state.value === PlayerState.Cued;
        if (!lastSeekCheckTime || !lastSeekCheckPlayerTime || videoNotReady || clockDelta < 0) {
            if (!videoNotReady) {
                lastSeekCheckPlayerTime = playerTime;
            }
            lastSeekCheckTime = now;
            lastState = state.value;
            return;
        }

        const playDelta = playerTime - lastSeekCheckPlayerTime;
        if (state.value === PlayerState.Paused && lastState === PlayerState.Paused) {
            if (playDelta) {
                emit('seek');
            }
        } else if (playDelta < -SEEK_CHECK_SLACK_S || playDelta > clockDelta + SEEK_CHECK_SLACK_S) {
            emit('seek');
        }

        if (props.videoId && Date.now() - lastVideoCueTime > VIDEO_CHECK_CUE_TIMEOUT_MS) {
            const playerVideoId = getVideoId();
            if (props.videoId !== playerVideoId) {
                player.cueVideoById(props.videoId);
                playbackRate.value = 1
                lastVideoCueTime = Date.now();
            }
        }

        lastSeekCheckPlayerTime = playerTime;
        lastSeekCheckTime = now;
        lastState = state.value;
    }, SEEK_CHECK_INTERVAL_MS);
});

watch(() => props.videoId, (newVideoId, oldVideoId) => {
    if (newVideoId === oldVideoId) {
        return;
    }

    if (player) {
        if (newVideoId) {
            player.cueVideoById(newVideoId);
            playbackRate.value = 1
            lastVideoCueTime = Date.now();
        } else {
            player.stopVideo();
        }
    } else {
        videoIdToBeQueued = newVideoId;
    }
    lastSeekCheckPlayerTime = null;
}, {
    immediate: true,
});

watch(() => [props.width, props.height], () => {
    if (player) {
        player.setSize(props.width, props.height);
    }
});

function getVideoId() {
    if (!player) {
        return null;
    }

    const url = player.getVideoUrl();
    if (!url) {
        return null;
    }

    return getVideoIdFromUrl(url);
}

const playbackRate = defineModel<number>('playbackRate', { default: 1 });
let playbackRateRequest = null as number | null;
function onPlaybackRateChange() {
    if (!player) {
        return;
    }

    playbackRate.value = player.getPlaybackRate();
    if (playbackRateRequest !== null) {
        playbackRateRequest = null;
    }
}
watch(playbackRate, rate => {
    if (rate === playbackRateRequest) {
        return;
    }

    if (!player) {
        playbackRateRequest = rate;
        return;
    }

    const currentRate = player.getPlaybackRate();
    if (currentRate === rate) {
        playbackRateRequest = null;
        return;
    }

    playbackRateRequest = rate;
    player.setPlaybackRate(rate);
    // TODO: Handle failure case
});
</script>

<template>
    <div class="youtube-container">
        <div :id="theElementId"></div>
    </div>
</template>

<style scoped>
.youtube-container {
    background-color: black;
    width: 100%;
    height: 100%;
}
</style>
