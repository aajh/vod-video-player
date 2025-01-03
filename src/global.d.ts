import yt from '@types/youtube'

// `yt` needs to be outside of `global` for some reason
interface Window {
  YT: yt;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}
