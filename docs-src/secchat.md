# SecChat — auditable team + agentic chat

**SecChat** is auditable team chat *and* agentic chat in one app, for CUI / air-gapped
enclaves — people talk to each other, spawn governed coding/assistant agents, hold voice and
video calls, and every message is tamper-evidently logged.

## What it does

- **Auditable by construction** — every message links into a per-channel SHA-256 hash chain
  bound to the content *hash* (not the plaintext), plus a metadata-only audit chain; tampering
  is detectable and CUI spillage stays purgeable.
- **Agents are first-class and governed** — spawn a SecAgent tied to you; it runs in *plan
  mode* by default, and only you can authorize code-executing work. Its model calls run
  through SecRouter, attributed and budgeted to you.
- **SSO from the ground up** — every session is a SecSSO (Authentik) session, validated via
  JWKS. No local passwords.
- **Native voice & video calling** — 1:1 and group calls ride the same WebRTC signaling as the
  chat WebSocket hub. Video is **live-only**: camera and screen share work during a call but
  are never recorded. A *consented* call is recorded **audio-only** by the `secchat-mediad`
  relay, then transcribed via SecRecorder into a speaker-exact transcript and posted to the
  channel with a best-effort LLM summary — either can be corrected afterward as a normal,
  chain-bound message revision.
- **Optional Kubernetes agent pool** — runs a coding agent in a server-launched, ephemeral pod
  instead of the user's desktop; the execute-gate stays on the server either way.
- **Light/dark theme** — a top-bar toggle switches the whole app, remembered across launches.

## Quickstart

```bash
cp .env.example .env
# set SECCHAT_OIDC_ISSUER / SECCHAT_OIDC_AUDIENCE (SecSSO) and PG_PASSWORD
./bootstrap/secchat.sh up          # build + start, wait for /healthz, print the wiring readout
```

## Learn more

- **[SecChat on GitHub](https://github.com/secrouter/secchat)** — source, issues, releases.
- **[SecChat docs](https://github.com/secrouter/secchat/tree/main/docs)** — configuration, a
  user-facing usage tour, the auth/marking/audit security model, and the CMMC control mapping.
