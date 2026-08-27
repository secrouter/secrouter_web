# SecRouter (gateway)

**SecRouter** is a self-hosted, OpenAI-compatible AI gateway that sits in front of your LLMs and
enforces governance and cost control on every request — chat, embeddings, and agentic **MCP
tool calls** alike: SSO authentication, per-user policy and budgets, deny-by-default egress with
a data-classification gate, and a hash-chained, metadata-only audit log.

It's a drop-in endpoint — point any OpenAI-compatible client at SecRouter, change the base URL,
and keep your code.

```{admonition} What it does
:class: tip
**Govern** — OIDC SSO + MFA, per-user/group allowlists for models *and* MCP tools, deny-by-default egress. Chat, embeddings, and tool calls all pass the same gates.
**Contain spend** — per-user token & cost tracking, budgets, rate limits, smart routing (including A/B and escalation experiments).
**Stay up** — a per-provider circuit breaker fails fast to the next authorized model; Prometheus `/metrics` + W3C trace propagation feed your SOC.
**Prove it** — tamper-evident audit and one-click evidence export, mapped to NIST 800-171 R2 / CMMC L3 controls.
```

This section covers SecRouter itself: [Deploy](deploy.md) (this page), [Usage](usage.md),
[Configuration](configuration.md), and [Control Validation](control-validation.md). For the rest
of the suite, see the [docs hub](index.md).

## The request pipeline

Every call flows through four gates, with usage metered and everything logged:

```text
client ──▶ AuthN ──▶ AuthZ ──▶ route ──▶ egress gate ──▶ authorized model
          (OIDC)    (policy +   (cheapest   (deny-by-default
                     quota)     capable)     + data residency)
```

If any gate says no, the request never leaves your boundary.

## Deploy

SecRouter runs as a single container (or a systemd service) inside your boundary. It is stateless except for a small SQLite store — the audit log and usage ledger — kept on a writable volume.

## Prerequisites

- A container runtime (Docker / Podman), or a Linux host for the systemd unit.
- An enterprise **OIDC IdP** (Keycloak, Okta, Entra, Ping) for SSO + MFA.
- An authorized model endpoint: **frontier OpenAI models on AWS Bedrock GovCloud** and/or **Azure AI Foundry in Azure Government** (both FedRAMP High / IL4–5), and/or self-hosted OpenAI-compatible models inside your boundary.
- For CUI: a **FIPS-validated TLS front end** (or a FIPS-linked runtime build).

## Run the container

The SecRouter image (built from the provided `Dockerfile`, or pulled from your registry) is multi-stage, non-root, and ships a `/health` check.

```bash
docker run -d --name secrouter --restart unless-stopped \
  -p 18800:18800 \
  -e SECROUTER_CONFIG=/var/lib/secrouter/config.json \
  -e SECROUTER_HOST=0.0.0.0 \
  -v /srv/secrouter:/var/lib/secrouter \
  secrouter:latest
```

- The **config and the SQLite store live on the writable volume**, so the admin console can register model endpoints and the audit/usage data survive restarts. Seed it once — copy your hardened config to `/srv/secrouter/config.json` before first start. The volume must be writable by the `node` user (uid 1000).
- `--restart unless-stopped` lets the console's **Restart** action bring the service back.

## Production configuration

Start from the hardened reference config (ships with the release) and fill in:

- **`oidc`** — your IdP issuer / audience / JWKS, and `requireMfa: true`.
- **`egress.allowlist`** — the deny-by-default destinations and the data classifications each may receive (your Bedrock GovCloud host and/or self-hosted model host).
- **`policy`** — per-group / per-user allowed tiers and models, budgets, and rate limits.
- **`requireFips: true`** and **`tls.mode: "frontend"`**.
- **`audit`** — `sink: "both"` plus your SIEM syslog target.

See [Configuration](configuration.md) for the full reference, and [Control Validation](control-validation.md) for how each setting becomes assessor evidence.

## TLS &amp; FIPS

Terminate TLS at a **FIPS-validated front end** (recommended): SecRouter binds localhost behind the proxy — set `tls.mode: "frontend"` and `requireFips: true`. Or terminate **natively** (`tls.mode: "native"` with a cert/key on a FIPS-linked runtime). The cipher policy follows NIST SP 800-52r2.

## Model providers (Bedrock ↔ Azure)

Frontier OpenAI models are served through two FedRAMP-High / IL4–5 clouds, both speaking the OpenAI chat format — so **switching a tier between them is a one-line config change** (flip the `primary`/`fallback` and keep both egress rules):

- **AWS Bedrock GovCloud** — use `api: "openai"` with `baseUrl: "https://bedrock-runtime.<region>.amazonaws.com/openai/v1"` and a **Bedrock API key** in `AWS_BEARER_TOKEN_BEDROCK`. Models like `bedrock/openai.gpt-oss-120b-1:0`.
- **Azure AI Foundry (Azure Government)** — use `api: "azure"` with `baseUrl: "https://<resource>.openai.azure.us"`, an `apiVersion`, and `azureAuth: "api-key"` (env-var key) or `"entra"` (a service-principal token, auto-fetched and cached). The model id is your **deployment name**, e.g. `azure/gpt-4o`.

Every provider still passes the deny-by-default egress + classification gate — add each host to `egress.allowlist`.

## GovCloud &amp; air-gap

- **GovCloud** — point egress at your Bedrock (`bedrock-runtime.<region>.amazonaws.com`) and/or Azure Government (`<resource>.openai.azure.us`) hosts; supply keys/secrets via environment variables (never in the config or logs).
- **Air-gapped** — route only to in-boundary self-hosted models; no outbound calls are required.

## systemd (non-container)

Install the provided `secrouter.service` unit, put the config at `/etc/secrouter/config.json` and secrets in `/etc/secrouter/secrets.env`, ensure the store directory is writable by the service user, then `systemctl enable --now secrouter`. The unit restarts on failure.

## Fail-closed startup

The server **refuses to start** if the security config is invalid, or if `requireFips` is set but FIPS crypto is unavailable — a misconfiguration never silently runs an unsafe gateway.

## Health &amp; restart

`GET /health` (unauthenticated) reports status and whether security is enabled — use it for liveness probes. Config changes made in the console are applied with **Reload** (no downtime) or **Restart**; with a restart policy in place the service returns automatically.
