import { describe, it, expect } from 'vitest';
import { audioExtension } from './audioFile';

describe('audioExtension', () => {
  it.each([
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/ogg;codecs=opus', 'ogg'],
    ['audio/mp4', 'mp4'],
    ['audio/x-m4a', 'm4a'],
    ['audio/mpeg', 'mp3'],
    ['audio/wav', 'wav'],
    ['AUDIO/WAV', 'wav'],
    ['', 'webm'],
    [undefined, 'webm'],
    ['audio/desconhecido', 'webm'],
  ])('%s -> %s', (mime, ext) => {
    expect(audioExtension(mime as string | undefined)).toBe(ext);
  });
});
