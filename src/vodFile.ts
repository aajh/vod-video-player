export enum MomentTag {
    CueVideo = 'cueVideo',
    LoadVideo = 'loadVideo',
    Play = 'play',
    Pause = 'pause',
    Stop = 'stop',
    Seek = 'seek',
}
export interface Moment {
    time: number;
    secondTime: number;
    videoId: string | null;
    playing: boolean;
    tag: MomentTag;
    argument?: number | string;
}

export interface VodFile {
    vodVideoId: string;
    timeline: Moment[];
}


const VOD_PARSER_VERSION = '1';
const WHITESPACE_REGEX = /\s+/;

// [time, tag, argument]
type FileMoment = [number, string, string | undefined];

enum ParserState {
    Header,
    Timeline,
}

export function parseVodFile(fileContent: string): VodFile | null {
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
                if (words.length !== 2 && words.length !== 3) {
                    console.error(`Invalid line ${line}`);
                    continue;
                }
                const [time, tag, argument] = words;
                const rawMoment: FileMoment = [parseInt(time, 10) / 1000 + timeOffset, tag, argument];
                rawTimeline.push(rawMoment);
                break;
        }
    }

    if (vodFileVersion !== VOD_PARSER_VERSION) {
        console.error(`Unsupported VOD file version ${vodFileVersion}. Expected version ${VOD_PARSER_VERSION}.`);
        return null;
    }
    if (!result.vodVideoId) {
        console.error('File had no VOD id');
        return null;
    }
    if (state !== ParserState.Timeline) {
        console.error('File did not contain a timeline');
        return null;
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
    for (let i = 0; i < timeline.length; i++) {
        const rawMoment = timeline[i];
        const time = rawMoment[0];
        const tag = rawMoment[1] as MomentTag;
        let argument: Moment['argument'] = rawMoment[2];

        switch (tag) {
            case MomentTag.CueVideo:
                secondTime = 0;
                videoId = argument ?? null;
                playing = false;
                break;
            case MomentTag.LoadVideo:
                secondTime = 0;
                videoId = argument ?? null;
                playing = true;
                break;
            case MomentTag.Play:
                secondTime += 0; // No-op
                playing = true;
                break;
            case MomentTag.Pause:
                secondTime += (time - previousVodTime);
                playing = false;
                break;
            case MomentTag.Stop:
                secondTime = 0;
                playing = false;
                break;
            case MomentTag.Seek:
                if (!argument) {
                    console.warn('No time given to seek');
                    continue;
                }
                argument = parseInt(argument, 10) / 1000;
                secondTime = argument;
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
            tag,
            argument: argument,
        };
    }

    return r;
}
