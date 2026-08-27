# The SecRouter suite — documentation

The **SecRouter suite** is a self-hostable set of components for running AI securely inside a
closed or regulated network: a governed gateway in front of every model, the identity/inference/
collaboration pieces around it, and one orchestrator that pins a tested version of the whole
stack and deploys it — air-gap friendly. Every piece is open source (Apache 2.0) and independent:
run the ones you need, drop the ones you already have.

This hub covers all of it. **[SecRouter](deploy.md)**, the governed AI gateway at the center,
keeps its own four-page section; every other component gets a short overview page here linking
out to its repo and its own in-depth docs.

## Identity & trust

*Optional — provide these when you have nothing, drop them when you already run an IdP/CA/DNS.*

- **[SecCert](seccert.md)** — internal ACME (RFC 8555) certificate authority; issues the suite's
  TLS certs on closed or air-gapped networks.
- **[SecSSO](secsso.md)** — single sign-on (Authentik), pre-wired OIDC blueprints and suite
  branding. Drop it the moment you have Okta, Entra, or Keycloak.
- **[secdns](secdns.md)** — zero-dependency authoritative DNS; resolves the suite's internal
  `*.internal` names when you run no DNS of your own.

## Gateway

- **[SecRouter](deploy.md)** — the governed AI gateway: authenticate every request, enforce
  model/tool/budget policy, gate egress, route (including A/B and escalation experiments), fail
  over dead providers, and log every decision. See the **SecRouter (gateway)** section in the
  sidebar for deploy, usage, configuration, and control-validation guides.

## Inference

- **[SecLLM](secllm.md)** — a friendly control plane for vLLM: curated model catalog,
  load/unload/reload, health management, and an OpenAI-compatible endpoint. SecRouter routes to
  it as a local, in-boundary provider.

## Agents & collaboration

- **[SecAgent](secagent.md)** — the agentic harness (pi + an affordance engine) behind MR
  review, static analysis, and docs/test generation. Every model call it makes is governed
  through SecRouter.
- **[SecChat](secchat.md)** — auditable team chat *and* agentic chat in one app: SSO via SecSSO,
  tamper-evident hash-chained audit, owner-gated coding agents, and native voice & video calling.
- **[SecRecorder](secrecorder.md)** — self-hosted Whisper transcription with optional speaker
  diarization; meeting audio and transcripts never leave the boundary.

## Edge

*Optional infrastructure.*

- **[SecProxy](secproxy.md)** — edge reverse proxy; one HTTPS front door (`:443`) for the
  suite's web and API services, FIPS-clean on hardened hosts.

## Orchestration

- **[SecDeploy](secdeploy.md)** — release train and deploy orchestration: one pinned, tested
  suite version per target, from a macOS eval box to a FIPS-ready Fedora host.

```{toctree}
:hidden:
:caption: Identity & trust

seccert
secsso
secdns
```

```{toctree}
:hidden:
:caption: SecRouter (gateway)

deploy
usage
configuration
control-validation
```

```{toctree}
:hidden:
:caption: Inference

secllm
```

```{toctree}
:hidden:
:caption: Agents & collaboration

secagent
secchat
secrecorder
```

```{toctree}
:hidden:
:caption: Edge

secproxy
```

```{toctree}
:hidden:
:caption: Orchestration

secdeploy
```
