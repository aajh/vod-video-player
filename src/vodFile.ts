export enum MomentTag {
    CueVideo = 'cueVideo',
    LoadVideo = 'loadVideo',
    Play = 'play',
    Pause = 'pause',
    Seek = 'seek',
    Sync = 'sync',
    ChangePlaybackRate = 'changePlaybackRate',
}
export interface Moment {
    time: number;
    secondTime: number;
    videoId: string | null;
    playing: boolean;
    playbackRate: number;
    tag: MomentTag;
    argument?: number | string;
}

export interface VodFile {
    vodVideoId: string;
    timeline: Moment[];
}

export class ParseError extends Error {
    filename?: string;

    constructor(message: string, filename?: string) {
        super(message);
        this.name = 'ParseError';
        this.filename = filename;
    }
}


const VOD_PARSER_VERSION = '1';
const WHITESPACE_REGEX = /\s+/;

// [time, tag, argument, argument2]
type FileMoment = [number, string, string | undefined, string | undefined];

enum ParserState {
    Header,
    Timeline,
}

export interface ParseOptions {
    filename?: string;
    timeOffsetOverrideSeconds?: number;
}

export function parseVodFile(fileContent: string, options: ParseOptions = {}): VodFile {
    let state = ParserState.Header;
    const result: Partial<VodFile> = {};
    let vodFileVersion = null;
    let timeOffset = 0;
    const rawTimeline: FileMoment[] = [];

    const lines = fileContent.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') {
            if (state === ParserState.Header) {
                state = ParserState.Timeline;
                if (typeof options?.timeOffsetOverrideSeconds === 'number') {
                    timeOffset = options.timeOffsetOverrideSeconds;
                }
            }
            continue;
        }

        const words = trimmed.split(WHITESPACE_REGEX);
        switch (state) {
            case ParserState.Header:
                switch (words[0]) {
                    case 'vodFileVersion':
                        vodFileVersion = words[1];
                        break;
                    case 'vodVideoId':
                        result.vodVideoId = words[1];
                        break;
                    case 'timeOffset':
                        timeOffset = parseInt(words[1], 10) / 1000;
                        break;
                    default:
                        console.error(`Invalid property ${words[0]}`);
                }
                break;
            case ParserState.Timeline:
                if (words.length < 2 || words.length > 4) {
                    console.error(`Invalid line ${line}`);
                    continue;
                }
                const [time, tag, argument, argument2] = words;
                const rawMoment: FileMoment = [parseInt(time, 10) / 1000 + timeOffset, tag, argument, argument2];
                rawTimeline.push(rawMoment);
                break;
        }
    }

    if (vodFileVersion !== VOD_PARSER_VERSION) {
        const message = `Unsupported VOD file version ${vodFileVersion}. Expected version ${VOD_PARSER_VERSION}.`;
        throw new ParseError(message, options.filename);
    }
    if (!result.vodVideoId) {
        const message = 'File has no VOD id';
        throw new ParseError(message, options.filename);
    }
    if (state !== ParserState.Timeline) {
        const message = 'File does not contain a timeline';
        throw new ParseError(message, options.filename);
    }

    result.timeline = parseTimelineMoments(rawTimeline);

    return result as VodFile;
}

function parseTimelineMoments(timeline: FileMoment[]): Moment[] {
    const r = [] as Moment[];
    r.length = timeline.length;

    let previousVodTime = 0;
    let secondTime = 0;
    let videoId: string | null = null;
    let playing = false;
    let playbackRate = 1;
    for (let i = 0; i < timeline.length; i++) {
        const rawMoment = timeline[i];
        const time = rawMoment[0];
        const tag = rawMoment[1] as MomentTag;
        let argument: Moment['argument'] = rawMoment[2];
        const argument2 = rawMoment[3];

        switch (tag) {
            case MomentTag.CueVideo:
                secondTime = 0;
                videoId = argument ?? null;
                playing = false;
                playbackRate = 1;
                break;
            case MomentTag.LoadVideo:
                secondTime = 0;
                videoId = argument ?? null;
                playing = true;
                playbackRate = 1;
                break;
            case MomentTag.Play:
                playing = true;
                if (argument) {
                    argument = parseInt(argument, 10) / 1000;
                    secondTime = argument;
                }
                break;
            case MomentTag.Pause:
                secondTime += playbackRate * (time - previousVodTime);
                playing = false;
                if (argument) {
                    argument = parseInt(argument, 10) / 1000;
                    secondTime = argument;
                }
                break;
            case MomentTag.Seek:
            case MomentTag.Sync:
                if (!argument) {
                    console.warn(`No time given to ${tag}`);
                    continue;
                }
                argument = parseInt(argument, 10) / 1000;
                secondTime = argument;
                break;
            case MomentTag.ChangePlaybackRate:
                if (!argument) {
                    console.warn('No playback rate given');
                    continue;
                }
                secondTime += playbackRate * (time - previousVodTime);
                argument = Number(argument);
                playbackRate = argument;
                if (argument2) {
                    secondTime = parseInt(argument2, 10) / 1000;
                }
                break;
            default:
                const exhaustiveSwitchCheck: never = tag;
                console.warn(`Unknown MomentTag ${exhaustiveSwitchCheck}`);
                break;
        }

        previousVodTime = time;
        r[i] = {
            time,
            secondTime,
            videoId,
            playing,
            playbackRate,
            tag,
            argument,
        };
    }

    return r;
}

export const VOD_FILE_TEMPLATE = 'vodFileVersion 1\nvodVideoId\ntimeOffset 0\n\n';

export function createFilenameTimestamp() {
    const now = new Date();
    return now.toISOString().replaceAll(':', '.');
}

export function saveToDisk(filename: string, fileContents: string) {
    const blob = new Blob([fileContents], { type: 'text/plain' });

    const a = document.createElement('a');
    a.download =filename;
    a.href = URL.createObjectURL(blob);
    a.textContent = 'Download ready';
    a.style.display = 'none';
    a.click();
    a.remove();
}
