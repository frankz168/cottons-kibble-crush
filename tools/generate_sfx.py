import wave, struct, math, random, os

def save_wav(filename, samples, sample_rate=44100):
    os.makedirs('assets', exist_ok=True)
    path = os.path.join('assets', filename)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        for s in samples:
            w.writeframesraw(struct.pack('<h', int(s * 32767)))

# 1. Pop (Block Match)
sr = 44100
dur = 0.1
samples_pop = []
for i in range(int(sr * dur)):
    t = i / sr
    freq = 1000 * math.exp(-20 * t)
    amp = math.exp(-30 * t)
    s = amp * math.sin(2 * math.pi * freq * t)
    samples_pop.append(s)
save_wav('sfx_pop.wav', samples_pop)

# 2. Whoosh (Block Swap)
dur = 0.15
samples_whoosh = []
for i in range(int(sr * dur)):
    t = i / sr
    amp = math.sin(math.pi * (t / dur)) # smooth envelope
    s = amp * random.uniform(-0.3, 0.3)
    samples_whoosh.append(s)
save_wav('sfx_whoosh.wav', samples_whoosh)

# 3. Bark (Combo)
dur = 0.2
samples_bark = []
for i in range(int(sr * dur)):
    t = i / sr
    # two barks
    env = max(0, math.sin(2 * math.pi * (t / dur) * 2)) if t < dur * 0.9 else 0
    freq = 400 + 200 * math.sin(2 * math.pi * 50 * t)
    s = env * (math.sin(2 * math.pi * freq * t) + random.uniform(-0.5, 0.5)) * 0.5
    samples_bark.append(s)
save_wav('sfx_bark.wav', samples_bark)

# 4. Bloop (UI Click)
dur = 0.1
samples_bloop = []
for i in range(int(sr * dur)):
    t = i / sr
    freq = 400 + 800 * t
    amp = math.exp(-10 * t)
    s = amp * math.sin(2 * math.pi * freq * t)
    samples_bloop.append(s)
save_wav('sfx_bloop.wav', samples_bloop)

print("SFX generated successfully.")
