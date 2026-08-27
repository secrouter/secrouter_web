# SecRecorder — self-hosted transcription

**SecRecorder** *(aka SpeakerBox)* is a self-hosted, OpenAI-compatible Whisper speech-to-text
server with optional speaker diarization. One codebase auto-selects its backend: **Apple
Silicon** → MLX (Metal GPU); **Linux / NVIDIA** → faster-whisper (CUDA), or CPU anywhere.

## What it does

- **Built-in web UI** at `/` — record from the mic or drop an audio file, transcribe with
  optional speaker labels and recognition, enroll speakers into the library, and copy/export
  the notes.
- **OpenAI-compatible** `POST /v1/audio/transcriptions` (word-level timestamps always
  returned), plus `GET /v1/models` and `GET /health`.
- **Speaker diarization + recognition** (both opt-in) — per-word speaker labels, then
  recognize enrolled speakers by name across recordings via a local voiceprint library.
- **Dead-air guard** — near-silent audio returns an empty transcript instead of a Whisper
  hallucination.
- **Optional SSO** (off by default) and **optional, governed summarization** (off by default,
  routed through SecRouter when enabled).
- **Tamper-evident audit trail**, on by default.

## Quickstart

```bash
git clone <this-repo> secrecorder && cd secrecorder
./install.sh          # sets up the venv
./run.sh               # 127.0.0.1:9000, prewarmed
```

Open `http://localhost:9000/` for the web UI, or point any OpenAI client's `base_url` at the API.

## Learn more

- **[SecRecorder on GitHub](https://github.com/secrouter/secrecorder)** — source, issues,
  releases.
- **[SecRecorder docs](https://github.com/secrouter/secrecorder/tree/main/docs)** — every
  environment variable, the full API/web-UI walkthrough, deployment, the security model, and
  the control mapping.
