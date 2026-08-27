# SecLLM — a control plane for vLLM

**SecLLM** wraps [vLLM](https://github.com/vllm-project/vllm) with a curated model catalog,
one-click load / unload / reload, automatic health management, and a clean console — self-hosted
inference that a non-expert can actually run. It speaks the OpenAI API, so SecRouter points at it
as a local, in-boundary provider.

## What it does

- **Manages vLLM for you** — each model runs as a supervised worker; several models can
  **coexist**, packed across your GPUs by available VRAM (or switch to one-model-at-a-time).
- **Health management** — a monitor probes every worker and auto-restarts failures (bounded),
  with a startup grace so slow model loads aren't killed prematurely.
- **One OpenAI endpoint** — `chat/completions`, `completions`, `embeddings`, `models` —
  routed by model name, streaming supported. A model that isn't loaded gets a clear 404/503,
  never a hang.
- **A console for humans** at `/admin` — pick a model from the catalog, load / unload / reload,
  download weights ahead of time with live progress, and watch health live.
- **Per-model API-call tracking** — requests, errors, latency, and tokens, shown live in the
  console (in-memory only; no request content stored).
- **Audited admin plane** — model load/unload/download and rejected admin attempts go to a
  tamper-evident, hash-chained log, with a one-shot CMMC evidence bundle.
- **US-origin catalog by default**, matching the suite's supply-chain posture.

## Quickstart

```bash
docker compose up -d          # SecLLM + a GPU-enabled vLLM backend
```

Open `http://<host>:11400/admin`, paste the admin token, and **Load** a model — then point any
OpenAI client, or SecRouter, at `http://<host>:11400/v1`.

## Learn more

- **[SecLLM on GitHub](https://github.com/secrouter/secllm)** — source, issues, releases.
- **[SecLLM docs](https://github.com/secrouter/secllm/tree/main/docs)** — deployment (Docker /
  native / systemd / multi-GPU), configuration, the API and console tour, security, and control
  validation.
