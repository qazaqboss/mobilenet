#!/bin/bash
set -e
cd /home/user/vs
# timeline: each segment = audio + 0.8 s breath; first segment gets 0.6 s lead-in
./venv/bin/python - <<'PY'
import json, soundfile as sf, numpy as np
segs = json.load(open('segments.json')); tl = []; parts = []; sr = None
for i, s in enumerate(segs):
    w, sr = sf.read(f"out/{s['id']}.wav", dtype='float32')
    if w.ndim > 1: w = w.mean(1)
    w = w / max(1e-6, np.abs(w).max()) * 0.89
    lead = 0.6 if i == 0 else 0.0
    tail = 2.0 if i == len(segs) - 1 else 0.8
    parts += [np.zeros(int(lead*sr), 'float32'), w, np.zeros(int(tail*sr), 'float32')]
    tl.append(dict(id=s['id'], sub=s['sub'], dur=lead + len(w)/sr + tail))
sf.write('narration.wav', np.concatenate(parts), sr)
json.dump(tl, open('timeline.json', 'w'), ensure_ascii=False)
print('total', round(sum(x['dur'] for x in tl), 1), 's')
PY
rm -rf frames && node record.js timeline.json /home/user/vs/frames
ffmpeg -loglevel error -y -framerate 30 -i frames/f%05d.jpg -i narration.wav \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -vf "scale=1920:1080:flags=lanczos" \
  -c:a aac -b:a 160k -af "loudnorm=I=-16:TP=-1.5" -shortest -movflags +faststart anatomy-presentation.mp4
ls -la anatomy-presentation.mp4
