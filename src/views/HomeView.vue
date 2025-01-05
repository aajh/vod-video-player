<template>
    <div class="container">
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
                files and unpause the VOD from the left player.
            </p>
            <p>
                Unfortunately there are some Youtube interfaces that can't be disabled, so
                for example, the recommendation interface needs to be closed once per playback.
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
                <pre>
vodFileVersion 1
vodVideoId dQw4w9WgXcQ
timeOffset 100

200 loadVideo xvFZjo5PgG0</pre>
            </p>
            <p>
                Along with pausing and unpausing, video changes and seeks are also recorder.
                To make seeks shorter than one second, the video should be paused, after which
                the video can be moved even frame by frame. (Playback speed adjustment is not yet supported.)
            </p>
            <p>
                The feature set is very bare-bones, and there are probably many bugs and incoveniences.
            </p>
        </main>
    </div>
</template>

<style scoped>
.container {
    margin-top: calc(var(--top-nav-height) + 3rem);
    padding: 0 3rem;
}

.content {
    max-width: var(--text-content-max-width);
    margin: 2rem auto;
}

h2 {
    margin-top: 3rem;
}

p {
    margin-top: 1rem;
    font-size: 1rem;
}

pre {
    margin-top: 0.5rem;
    background: var(--color-background-soft);
    border-radius: 0.5rem;
    padding: 1rem;

    code {
        margin: 0;
    }
}
</style>
