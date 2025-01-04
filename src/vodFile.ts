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
    value: number | string | null;
}

export interface VodFile {
    vodId: string;
    timeline: Moment[];
}


const VOD_PARSER_VERSION = '1';
const WHITESPACE_REGEX = /\s+/;

type FileMoment = [number, string, string | undefined];

enum ParserState {
    Header,
    Timeline,
}

export function parseVodFile(fileContent: string): VodFile | null {
    let state = ParserState.Header;
    const result: Partial<VodFile> = {};
    let vodFileVersion = null;
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
                    case 'vodId':
                        result.vodId = words[1];
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
                const [time, tag, value] = words;
                const rawMoment: FileMoment = [parseInt(time, 10) / 1000, tag, value];
                rawTimeline.push(rawMoment);
                break;
        }
    }

    if (vodFileVersion !== VOD_PARSER_VERSION) {
        console.error(`Unsupported VOD file version ${vodFileVersion}. Expected version ${VOD_PARSER_VERSION}.`);
        return null;
    }
    if (!result.vodId) {
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
        let value: Moment['value'] = rawMoment[2] ?? null;

        switch (tag) {
            case MomentTag.CueVideo:
                secondTime = 0;
                videoId = value;
                playing = false;
                break;
            case MomentTag.LoadVideo:
                secondTime = 0;
                videoId = value;
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
                if (!value) {
                    console.warn('No time given to seek');
                    continue;
                }
                value = parseInt(value, 10) / 1000;
                secondTime = value;
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
            value,
        };
    }

    return r;
}
