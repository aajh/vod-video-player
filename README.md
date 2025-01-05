# vod-video-player

Single page application to record and replay VOD's with autopausing videos.

## Notes

- When the video is paused, there will be a recommendation window that needs to be closed once per playback (Youtube removed the API option to disable the recommendations in 2018).
- When recording and the video is not paused, seeks smaller than one second might not be detected. When paused all seeks are included, even when seeking by frames.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
