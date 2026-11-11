# Видеопрезентация

`anatomy-presentation.mp4` — 5:43, 1920×1080, 30 fps. Озвучка: демо-голос VoiceStudio
(`backend/assets/samples/demo_voice.wav`), клонированный моделью OmniVoice (k2-fsa/OmniVoice) на русский текст.

## Как пересобрать

Пути в скриптах абсолютные (`/home/user/vs`, `/home/user/debpalash/voicestudio`) — поправьте под себя.

1. `tools/script.py` — текст глав: субтитры и вариант для синтеза речи → `segments.json`.
2. `tools/tts.py segments.json` — синтез каждой главы в `out/<id>.wav` (OmniVoice, CPU ≈ 10 с расчёта на 1 с речи).
3. `tools/build.sh` — таймлайн по длительности реплик, покадровая запись сайта в режиме `?capture`
   (`tools/record.js` + `tools/director.js`: скролл, облёт и наезд 3D-камеры, клики по легенде, субтитры)
   и сборка MP4 через ffmpeg.

Сайт должен быть доступен на `http://localhost:8765/` (`python3 -m http.server 8765` в корне репозитория).
