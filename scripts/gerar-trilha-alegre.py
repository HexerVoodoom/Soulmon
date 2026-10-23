#!/usr/bin/env python3
"""
Gerador procedural da trilha do Soulmon — versão ALEGRE.
Mais animada, feliz e tranquila. Acordes maiores, movimento melódico, energia positiva.
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
            phase = (ti % period) / period
            if phase < 0.25:
                wave[i] = 4 * phase
            elif phase < 0.75:
                wave[i] = 2 - 4 * phase
            else:
                wave[i] = 4 * phase - 4
        return amplitude * wave

    def adsr_envelope(self, duration, attack=0.02, decay=0.05, sustain=0.8, release=0.1):
        """Envelope ADSR."""
        n_total = int(self.sr * duration)
        n_attack = int(self.sr * attack)
        n_decay = int(self.sr * decay)
        n_release = int(self.sr * release)
        n_sustain = n_total - n_attack - n_decay - n_release

        envelope = np.concatenate([
            np.linspace(0, 1, n_attack),
            np.linspace(1, sustain, n_decay),
            np.full(max(1, n_sustain), sustain),
            np.linspace(sustain, 0, n_release),
        ])
        return envelope[:n_total]

    def chord(self, root_freq, intervals, duration, waveform='sine', amplitude=1.0):
        """Sintetiza um acorde."""
        wave = np.zeros(int(self.sr * duration))
        envelope = self.adsr_envelope(duration, attack=0.08, decay=0.08, sustain=0.85, release=0.08)

        for interval in intervals:
            freq = root_freq * (2 ** (interval / 12))
            if waveform == 'sine':
                w = self.sine_wave(freq, duration, amplitude=amplitude / len(intervals))
            elif waveform == 'triangle':
                w = self.triangle_wave(freq, duration, amplitude=amplitude / len(intervals))
            wave += w * envelope

        return wave

def build_base_layer(sr=44100, bpm=100, bars=12):
    """Camada base: pad harmônico ALEGRE com acordes maiores."""
    beat_duration = 60 / bpm
    bar_duration = beat_duration * 4
    total_duration = bar_duration * bars

    osc = OscillatorBank(sr)
    wave = np.zeros(int(sr * total_duration))

    # Progressão MAIOR: C - G - F - C (mais luminosa e esperançosa)
    # C3 = 130.81 Hz
    chords = [
        (130.81, [0, 4, 7]),        # C (C, E, G) — maior
        (130.81 * 1.5, [0, 4, 7]),  # G (G, B, D)
        (130.81 * 1.333, [0, 4, 7]), # F (F, A, C)
        (130.81, [0, 4, 7]),        # C (resolução)
    ]

    for chord_idx, (root, intervals) in enumerate(chords):
        start_time = chord_idx * 3 * bar_duration
        chord_wave = osc.chord(
            root, intervals,
            duration=3 * bar_duration,
            waveform='sine',  # sine para mais brilho
            amplitude=0.4  # mais volume
        )
        wave[int(sr * start_time):int(sr * start_time) + len(chord_wave)] += chord_wave

    # Envelope mais vivo (ataque/release rápidos)
    full_envelope = osc.adsr_envelope(
        total_duration,
        attack=0.3, decay=0.15, sustain=0.9, release=0.2
    )
    wave *= full_envelope

    return wave / (np.max(np.abs(wave)) + 1e-9)

def build_rhythm_layer(sr=44100, bpm=100, bars=12):
    """Camada rítmica: melodia ANIMADA e feliz."""
    beat_duration = 60 / bpm
    bar_duration = beat_duration * 4
    total_duration = bar_duration * bars

    osc = OscillatorBank(sr)
    wave = np.zeros(int(sr * total_duration))

    # Melodia MAIOR: notas alegres em C maior + algumas extensões
    # Mais notas, mais movimento, saltos alegres
    melody_notes = [
        # Ciclo 1: ascendente (esperança)
        (130.81 * 2, 0.375),           # C (oitava)
        (130.81 * 2.25, 0.375),        # E (tera)
        (130.81 * 2.5, 0.375),         # G (quinta)
        (130.81 * 2.8, 0.375),         # B (sétima — maior 7)
        # Ciclo 2: expansão
        (130.81 * 3, 0.5),             # C (oitava acima) — pico de alegria
        (130.81 * 2.5, 0.375),         # G (volta)
        (130.81 * 2.25, 0.375),        # E
        (130.81 * 2, 0.375),           # C (repouso)
        # Ciclo 3: movimento flutuante (tranquilidade)
        (130.81 * 2.25, 0.5),          # E — confortável
        (130.81 * 2, 0.375),           # C
        (130.81 * 1.5 * 2, 0.375),     # G (queda suave)
        (130.81 * 2, 0.5),             # C (resolução)
    ]

    # Repete 3 vezes (12 compassos)
    for cycle in range(3):
        for note_idx, (freq, note_duration) in enumerate(melody_notes):
            start_time = cycle * 4 * bar_duration + note_idx * 0.375 * bar_duration

            # Notas com envelope mais vivo (ataque rápido)
            note_wave = osc.sine_wave(freq, note_duration)
            note_envelope = osc.adsr_envelope(
                note_duration,
                attack=0.03, decay=0.08, sustain=0.8, release=0.08
            )
            note_wave *= note_envelope

            # Vibrato mais expressivo (nota alegre)
            t = np.arange(len(note_wave)) / sr
            vibrato = 1 + 0.035 * np.sin(2 * np.pi * 6 * t)  # 6 Hz, mais intenso
            note_wave *= vibrato

            # Tremolo sutil (flutuação de amplitude — vida)
            tremolo = 1 + 0.08 * np.sin(2 * np.pi * 2.5 * t)  # 2.5 Hz
            note_wave *= tremolo

            start_idx = int(sr * start_time)
            end_idx = start_idx + len(note_wave)
            if end_idx <= len(wave):
                wave[start_idx:end_idx] += note_wave * 0.35  # Mais presente

    return wave / (np.max(np.abs(wave)) + 1e-9)

def normalize_to_lufs(audio, target_lufs=-28.0, sr=44100):
    """Normaliza para loudness alvo (LUFS)."""
    rms = np.sqrt(np.mean(audio ** 2))
    if rms < 1e-3:
        return audio

    current_lufs = 20 * np.log10(rms + 1e-9)
    gain_db = target_lufs - current_lufs
    gain_linear = 10 ** (gain_db / 20)

    normalized = audio * gain_linear

    peak = np.max(np.abs(normalized))
    if peak > 0.891:
        normalized *= 0.891 / (peak + 1e-9)

    return normalized

def main():
    print("🎵 Gerando trilha alegre do Soulmon...")

    sr = 44100
    bpm = 100
    bars = 12

    print("  → Camada base (pad harmônico maior)...")
    base = build_base_layer(sr, bpm, bars)

    print("  → Camada rítmica (melodia animada)...")
    rhythm = build_rhythm_layer(sr, bpm, bars)

    # Mescla com mais presença da rítmica
    mono = (base * 0.65 + rhythm * 0.85) / 1.5

    print("  → Normalizando para −28.0 LUFS...")
    mono_normalized = normalize_to_lufs(mono, target_lufs=-28.0, sr=sr)
    mono_normalized = np.clip(mono_normalized, -1.0, 1.0)

    int16_max = 32767
    audio_int16 = np.int16(mono_normalized * int16_max)

    output_path = 'public/sounds/trilha-soulmon-alegre.wav'
    wavfile.write(output_path, sr, audio_int16)

    print(f"✅ Trilha alegre salva em: {output_path}")
    print(f"   Duração: {len(audio_int16) / sr:.2f}s")
    print(f"   Loudness alvo: −28.0 LUFS")
    print(f"   BPM: {bpm}")
    print(f"   Loop: {bars} compassos")
    print(f"\n📋 Próximo passo:")
    print(f"   ffmpeg -i {output_path} -c:a libopus -b:a 48k public/sounds/trilha-soulmon-alegre.webm -y")

if __name__ == '__main__':
    main()
