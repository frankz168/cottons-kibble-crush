import wave, struct, math, os

def save_wav(filename, samples, sample_rate=44100):
    os.makedirs('assets/audio', exist_ok=True)
    path = os.path.join('assets/audio', filename)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        for s in samples:
            w.writeframesraw(struct.pack('<h', int(s * 32767)))

def generate_melody(notes_sequence, bpm, duration_multiplier=1.0):
    sr = 44100
    samples = []
    beat_dur = 60.0 / bpm
    
    # Note frequencies (C4 = 261.63, etc)
    freqs = {'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99}
    
    for note, length in notes_sequence:
        dur = beat_dur * length * duration_multiplier
        num_samples = int(sr * dur)
        if note == 'REST':
            samples.extend([0] * num_samples)
            continue
            
        freq = freqs.get(note, 440)
        for i in range(num_samples):
            t = i / sr
            # Square wave for retro cheerful feel
            s = 0.15 * (1.0 if math.sin(2 * math.pi * freq * t) > 0 else -1.0)
            
            # Envelope (decay)
            env = max(0, 1.0 - (i / num_samples))
            samples.append(s * env)
            
    return samples

# 1. BGM Home (Upbeat C Major Arpeggios)
seq_home = [
    ('C4', 0.5), ('E4', 0.5), ('G4', 0.5), ('C5', 0.5),
    ('E5', 1.0), ('C5', 0.5), ('G4', 0.5),
    ('F4', 0.5), ('A4', 0.5), ('C5', 0.5), ('F4', 0.5),
    ('E4', 1.0), ('C4', 1.0)
] * 4
save_wav('bgm_home.wav', generate_melody(seq_home, 140))

# 2. BGM Game 1 (Playful bouncy)
seq_game1 = [
    ('C5', 0.25), ('REST', 0.25), ('G4', 0.25), ('REST', 0.25),
    ('E4', 0.25), ('REST', 0.25), ('G4', 0.25), ('REST', 0.25),
    ('D5', 0.25), ('REST', 0.25), ('G4', 0.25), ('REST', 0.25),
    ('F4', 0.25), ('REST', 0.25), ('G4', 0.25), ('REST', 0.25)
] * 8
save_wav('bgm_game1.wav', generate_melody(seq_game1, 160))

# 3. BGM Game 2 (Fast energetic)
seq_game2 = [
    ('G4', 0.5), ('G4', 0.5), ('A4', 0.5), ('G4', 0.5),
    ('C5', 0.5), ('B4', 1.0), ('REST', 0.5),
    ('G4', 0.5), ('G4', 0.5), ('A4', 0.5), ('G4', 0.5),
    ('D5', 0.5), ('C5', 1.0), ('REST', 0.5)
] * 4
save_wav('bgm_game2.wav', generate_melody(seq_game2, 180))

print("Cheerful BGMs generated.")
