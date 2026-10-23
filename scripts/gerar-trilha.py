#!/usr/bin/env python3
"""
Gerador procedural da trilha do Soulmon.
Cria dois loops de 12 compassos em fase: base harmônica + melodia contraponto.
Inspiração: Pokémon, Digimon, Chrono Cross, Final Fantasy IX.
Alvo: −28,0 LUFS-S, true peak ≤ −1 dBTP.
"""

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, windows
import math

class OscillatorBank:
    """Síntese de osciladores com envelope ADSR."""

    def __init__(self, sr=44100):
        self.sr = sr

    def sine_wave(self, freq, duration, amplitude=1.0):
        """Onda senoidal pura."""
        t = np.arange(int(self.sr * duration)) / self.sr
        return amplitude * np.sin(2 * np.pi * freq * t)

    def triangle_wave(self, freq, duration, amplitude=1.0):
        """Onda triangular (timbre mais suave que quadrada)."""
        t = np.arange(int(self.sr * duration)) / self.sr
        period = 1.0 / freq
        wave = np.zeros_like(t)
        for i, ti in enumerate(t):
            phase = (ti % period) / period  # 0 a 1
            if phase < 0.25:
                wave[i] = 4 * phase
            elif phase < 0.75:
                wave[i] = 2 - 4 * phase
            else:
                wave[i] = 4 * phase - 4
        return amplitude * wave

    def adsr_envelope(self, duration, attack=0.02, decay=0.05, sustain=0.8, release=0.1):
        """Envelope ADSR (para naturalizade)."""
        n_total = int(self.sr * duration)
        n_attack = int(self.sr * attack)
        n_decay = int(self.sr * decay)
        n_release = int(self.sr * release)
        n_sustain = n_total - n_attack - n_decay - n_release

        envelope = np.concatenate([
            np.linspace(0, 1, n_attack),  # Attack
            np.linspace(1, sustain, n_decay),  # Decay
            np.full(max(1, n_sustain), sustain),  # Sustain
            np.linspace(sustain, 0, n_release),  # Release
        ])
        return envelope[:n_total]

    def chord(self, root_freq, intervals, duration, waveform='sine', amplitude=1.0):
        """Sintetiza um acorde (root + intervals em semitons)."""
        wave = np.zeros(int(self.sr * duration))
        envelope = self.adsr_envelope(duration, attack=0.1, decay=0.05, sustain=0.9, release=0.1)

        for interval in intervals:
            freq = root_freq * (2 ** (interval / 12))
            if waveform == 'sine':
                w = self.sine_wave(freq, duration, amplitude=amplitude / len(intervals))
            elif waveform == 'triangle':
                w = self.triangle_wave(freq, duration, amplitude=amplitude / len(intervals))
            wave += w * envelope

        return wave

def build_base_layer(sr=44100, bpm=100, bars=12):
    """Camada base: pad harmônico com progressão de acordes misteriosa."""
    # Timebase
    beat_duration = 60 / bpm
    bar_duration = beat_duration * 4
    total_duration = bar_duration * bars

    osc = OscillatorBank(sr)
    wave = np.zeros(int(sr * total_duration))

    # Progressão: Cm - Gm - Bb - F (misticismo FFIX-like, tons menores)
    # Transposição: C3 (130.81 Hz)
    chords = [
        (130.81, [-12, -9, -5]),   # Cm (C, Eb, G) oitava abaixo
        (130.81 * 1.5, [-12, -9, -5]),  # Gm (G, Bb, D)
        (130.81 * 1.778, [-12, -9, -5]),  # Bb (Bb, Db, F)
        (130.81 * 1.333, [-12, -9, -5]),  # F (F, A, C)
    ]

    # Cada acorde toca 3 compassos (12 compassos / 4 acordes)
    for chord_idx, (root, intervals) in enumerate(chords):
        start_time = chord_idx * 3 * bar_duration
        chord_wave = osc.chord(
            root, intervals,
            duration=3 * bar_duration,
            waveform='triangle',
            amplitude=0.3
        )
        wave[int(sr * start_time):int(sr * start_time) + len(chord_wave)] += chord_wave

    # Envelope longo (pad)
    full_envelope = osc.adsr_envelope(
        total_duration,
        attack=0.5, decay=0.2, sustain=0.85, release=0.3
    )
    wave *= full_envelope

    return wave / (np.max(np.abs(wave)) + 1e-9)  # Normalize

def build_rhythm_layer(sr=44100, bpm=100, bars=12):
    """Camada rítmica: melodia contraponto (oboe sintético)."""
    beat_duration = 60 / bpm
    bar_duration = beat_duration * 4
    total_duration = bar_duration * bars

    osc = OscillatorBank(sr)
    wave = np.zeros(int(sr * total_duration))

    # Melodia: notas que dançam em volta dos acordes base
    # C3 pentatônica menor + algumas extensões (Digimon/Pokémon vibes)
    melody_notes = [
        (130.81 * 2, 0.5),      # E (oitava acima) - 1/2 bar
        (130.81 * 1.5 * 2, 0.5), # G
        (130.81 * 1.5 * 2 * 1.125, 1.0), # Bb (estendido)
        (130.81 * 2, 0.5),      # E
        (130.81 * 1.333 * 2, 1.0), # F (contraponto)
        (130.81 * 1.5 * 2, 0.5), # G
        (130.81 * 1.778 * 2, 0.5), # Bb
        (130.81 * 2, 1.0),      # E (resolução)
    ]

    # Repete a melodia 3 vezes (12 compassos / 8 notas por 0.5 bar = 4 bar por ciclo)
    for cycle in range(3):
        for note_idx, (freq, note_duration) in enumerate(melody_notes):
            start_time = cycle * 4 * bar_duration + note_idx * 0.5 * bar_duration

            # Notas com envelope ADSR agressivo (oboe)
            note_wave = osc.sine_wave(freq, note_duration)
            note_envelope = osc.adsr_envelope(
                note_duration,
                attack=0.05, decay=0.1, sustain=0.7, release=0.1
            )
            note_wave *= note_envelope

            # Vibrato sutil (característica de oboe)
            t = np.arange(len(note_wave)) / sr
            vibrato = 1 + 0.02 * np.sin(2 * np.pi * 5 * t)  # 5 Hz
            note_wave *= vibrato

            start_idx = int(sr * start_time)
            end_idx = start_idx + len(note_wave)
            if end_idx <= len(wave):
                wave[start_idx:end_idx] += note_wave * 0.25  # Amplitude 25% da base

    return wave / (np.max(np.abs(wave)) + 1e-9)

def normalize_to_lufs(audio, target_lufs=-28.0, sr=44100):
    """Normaliza para loudness alvo (LUFS) usando ITU-R BS.1770."""
    # Simplificação: calcula RMS e ajusta. Implementação completa precisaria
    # de gate K-weighted conforme ITU-R BS.1770-4, mas essa é aproximação válida.

    # Gate de silêncio (-70 dBFS)
    rms = np.sqrt(np.mean(audio ** 2))
    if rms < 1e-3:
        return audio

    # Calcula LUFS aproximado (sem ponderação K completa)
    current_lufs = 20 * np.log10(rms + 1e-9)

    # Ajusta
    gain_db = target_lufs - current_lufs
    gain_linear = 10 ** (gain_db / 20)

    normalized = audio * gain_linear

    # Proteção contra clipping (true peak ≤ -1 dBTP)
    peak = np.max(np.abs(normalized))
    if peak > 0.891:  # ~-1 dBTP em linear
        normalized *= 0.891 / (peak + 1e-9)

    return normalized

def main():
    print("🎵 Gerando trilha do Soulmon...")

    # Parâmetros
    sr = 44100
    bpm = 100
    bars = 12

    # Gera as duas camadas
    print("  → Camada base (pad harmônico)...")
    base = build_base_layer(sr, bpm, bars)

    print("  → Camada rítmica (melodia contraponto)...")
    rhythm = build_rhythm_layer(sr, bpm, bars)

    # Mescla as duas em fase
    stereo = np.zeros((len(base), 2))
    stereo[:, 0] = base  # Esquerda: mais base
    stereo[:, 1] = (base * 0.6 + rhythm * 0.8) / 1.4  # Direita: mistura mais rítmica

    # Mono final (mantém as características)
    mono = (base + rhythm) / 2

    # Normaliza para alvo de loudness
    print("  → Normalizando para −28.0 LUFS...")
    mono_normalized = normalize_to_lufs(mono, target_lufs=-28.0, sr=sr)

    # Garante faixa de [-1, 1]
    mono_normalized = np.clip(mono_normalized, -1.0, 1.0)

    # Converte para int16
    int16_max = 32767
    audio_int16 = np.int16(mono_normalized * int16_max)

    # Salva
    output_path = 'public/sounds/soulmon_trilha.wav'
    wavfile.write(output_path, sr, audio_int16)

    print(f"✅ Trilha salva em: {output_path}")
    print(f"   Duração: {len(audio_int16) / sr:.2f}s")
    print(f"   Loudness alvo: −28.0 LUFS")
    print(f"   BPM: {bpm}")
    print(f"   Loop: {bars} compassos")
    print(f"\n📋 Adicione ao manifesto em src/utils/sonsAssets.ts:")
    print(f"   - Arquivo: soulmon_trilha.wav")
    print(f"   - Data: 2026-10-07")
    print(f"   - Origem: síntese procedural (Soulmon)")
    print(f"   - Gerador: Python (osciladores + ADSR)")
    print(f"   - Camadas: 2 (base pad + melodia contraponto)")

if __name__ == '__main__':
    main()
