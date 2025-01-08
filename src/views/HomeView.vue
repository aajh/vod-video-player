<script setup lang="ts">
import Navigation from '@/components/Navigation.vue';
</script>

<template>
    <div class="container">
        <Navigation />
        <main class="content">
            <h1>VOD Video Player</h1>
            <p>
                This is an app for watching VODs with a second video
                playing and automatically pausing along with the VOD.
                The two videos are kept in sync with a file containing
                the times to pause and unpause the other video.
            </p>
            <p>
                To start watching, select the VOD sync file from your local
                files or from a link URL and unpause the VOD from the left player
                to start watching.
            </p>
            <p>
                Unfortunately, there are some Youtube interfaces that can't be disabled, so
                for example, the recommendation interface needs to be closed once per playback.
            </p>
            <p>
                Here's a link to a <RouterLink to="/watch?load=%2Fvod_recording_demo.txt">demo VOD recording</RouterLink>.
                It has a fast playback rate most of the time and a lot of seeking, so the other video might be buffering
                a lot, and therefore lag and skip somewhat.
            </p>

            <h2>Recording</h2>
            <p>
                New VOD sync file can be recorder with the <RouterLink to="/record">recording functionality</RouterLink>.
                Paste the Youtube video URL or ID to the text input and press "change video" to load a video to watch
                and when ready, start recording the VOD by pressing the start button. When done press stop and then download
                buttons and you have a file with the sync information.
            </p>
            <p>
                After you have uploaded the VOD to Youtube, open the VOD sync file and put
                its ID after <code>vodVideoId</code> and adjust the <code>timeOffset</code>
                (milliseconds) to sync the VOD start to the sync recording start.
            </p>
            <p>
                An example VOD file looks like this (<RouterLink to="/watch?load=%2Fexample_vod.txt">demo link</RouterLink>):
            </p>
            <pre>
vodFileVersion 1
vodVideoId M7lc1UVf-VE
timeOffset 800

200 loadVideo xvFZjo5PgG0
3500 seek 500</pre>
            <p>
                Along with pausing and unpausing, video changes, playback rate adjustments and seeks are also recorded.
                To make seeks shorter than one second, the video should be paused, after which
                all seeks can be recorded. On playback, paused video might be off by a frame.
            </p>
        </main>
    </div>
</template>

<style scoped>
.content {
    max-width: var(--text-content-max-width);
    margin: 2rem auto 5rem;
    margin-top: 2rem;
    padding: 0 3rem;
}

h2 {
    margin-top: 3rem;
}

p {
    margin-top: 1rem;
    font-size: 1rem;
}

pre {
    margin: 0.5rem 0 1.25rem;
    background: var(--color-background-soft);
    border-radius: 0.5rem;
    padding: 1rem;

    code {
        margin: 0;
    }
}
</style>
