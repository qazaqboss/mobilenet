import sys, json, time, torch, soundfile as sf
sys.path.insert(0, '/home/user/debpalash/voicestudio')
from omnivoice import OmniVoice
torch.set_num_threads(4)
REF = '/home/user/debpalash/voicestudio/backend/assets/samples/demo_voice.wav'
REF_TEXT = "Hey. I'm the VoiceStudio demo voice. I was made right here, on your machine: private, local, and ready whenever you are."
segs = json.load(open(sys.argv[1]))
only = set(sys.argv[2:])
m = OmniVoice.from_pretrained('/home/user/vs/OmniVoice', device_map='cpu', dtype=torch.float32)
prompt = m.create_voice_clone_prompt(ref_audio=REF, ref_text=REF_TEXT) if hasattr(m,'create_voice_clone_prompt') else None
for s in segs:
    if only and s['id'] not in only: continue
    t0 = time.time()
    kw = dict(voice_clone_prompt=prompt) if prompt is not None else dict(ref_audio=REF, ref_text=REF_TEXT)
    a = m.generate(text=s['tts'], language='ru', num_step=32, seed=7, **kw)[0]
    w = a.squeeze().float().cpu().numpy()
    sf.write(f"/home/user/vs/out/{s['id']}.wav", w, m.sampling_rate)
    print(s['id'], f"{len(w)/m.sampling_rate:.1f}s audio in {time.time()-t0:.0f}s", flush=True)
