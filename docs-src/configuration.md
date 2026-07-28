# Configuration

SecRouter reads a single JSON config file, resolved in this order:

1. `FREEROUTER_CONFIG` environment variable
2. `./freerouter.config.json` (working directory)
3. `~/.config/freerouter/config.json`

The `security` block is **validated at startup and fails closed** — the server refuses to boot in an unsafe configuration. Start production from the hardened reference config that ships with the release.

## Shape

```json
{
  "providers": {
    "bedrock": { "api": "openai", "baseUrl": "https://bedrock-runtime.us-gov-west-1.amazonaws.com/openai/v1", "auth": { "type": "env", "key": "AWS_BEARER_TOKEN_BEDROCK" } },
    "azure":   { "api": "azure", "baseUrl": "https://<resource>.openai.azure.us", "apiVersion": "2024-10-21", "azureAuth": "api-key", "auth": { "type": "env", "key": "AZURE_OPENAI_API_KEY" } },
    "local":   { "api": "openai", "baseUrl": "https://llm.internal.example.url/v1" }
  },
  "tiers": {
    "SIMPLE":    { "primary": "bedrock/openai.gpt-oss-20b-1:0",  "fallback": ["local/llama-3.3-70b-instruct"] },
    "MEDIUM":    { "primary": "bedrock/openai.gpt-oss-120b-1:0", "fallback": ["azure/gpt-4o"] },
    "COMPLEX":   { "primary": "bedrock/openai.gpt-oss-120b-1:0", "fallback": ["azure/gpt-4o"] }
  },
  "security": { "...": "see below" }
}
```

Frontier **OpenAI models** are served two compliant ways, both speaking the OpenAI chat format so switching a tier between them is a one-line change:

- **Amazon Bedrock (GovCloud)** — Bedrock's OpenAI-compatible endpoint (`{bedrock-runtime}/openai/v1`) authenticated with a Bedrock API key. Use `api: "openai"` and set the base URL to `.../openai/v1`.
- **Azure AI Foundry** (Azure OpenAI) — `api: "azure"` with your resource `baseUrl` (`…openai.azure.us` for Azure Government), an `apiVersion`, and `azureAuth` of `"api-key"` (key in an env var) or `"entra"` (a `{ tenantId, clientId, clientSecretEnv, authority, scope }` service principal). The model id is your **deployment name**.

```{list-table}
:header-rows: 1

* - Block
  - Purpose
* - `providers`
  - Backends and how to reach them. `api` is `openai` (any OpenAI-compatible endpoint, including Bedrock's `/openai/v1`), `azure` (Azure AI Foundry — with `apiVersion` + `azureAuth`), `anthropic`, or `bedrock` (native SigV4).
* - `tiers`
  - Which model serves each tier (`SIMPLE` → `REASONING`), with optional `fallback`.
* - `models`
  - Optional per-model catalog (`id`, `name`, `inputPrice`, `outputPrice`, `kind`, …) overlaid on the built-in registry, so local / on-prem models carry pricing for cost tracking. `kind: "embedding"` marks an embedding model (never routed for chat). Prices are `$`/M tokens and default to `0`. Usually managed by the console's *add endpoint* wizard.
* - `embeddings`
  - `{ "default": "provider/model" }` — the embedding model used by `POST /v1/embeddings` when the client sends `"auto"`/none.
* - `security`
  - Auth, per-user policy, egress control, audit, and TLS/FIPS. Off unless `enabled: true`.
```

## The `security` block

```json
"security": {
  "enabled": true,
  "requireFips": true,

  "oidc": {
    "issuer": "https://idp.example.url/realms/cui",
    "audience": "secrouter",
    "requireMfa": true,
    "groupsClaim": "groups",
    "clientId": "secrouter-admin-console"
  },

  "classification": { "default": "CUI", "levels": ["UNCLASSIFIED", "CUI"] },

  "egress": {
    "allowlist": [
      { "provider": "bedrock",
        "allowedHost": "bedrock-runtime.us-gov-west-1.amazonaws.com",
        "authorizedClassifications": ["CUI"] }
    ]
  },

  "policy": {
    "default": { "allowedTiers": ["SIMPLE", "MEDIUM"], "budgets": [{ "window": "day", "maxCostUsd": 25 }] },
    "groups": {
      "secrouter-admins": { "admin": true },
      "power-users": { "allowedTiers": ["SIMPLE", "MEDIUM", "COMPLEX", "REASONING"] }
    }
  },

  "audit": { "sink": "both", "syslog": { "host": "siem.example.url", "port": 6514, "protocol": "tcp" } },
  "tls": { "mode": "frontend" }
}
```

```{list-table}
:header-rows: 1

* - Key
  - What it controls
* - `oidc`
  - Token validation: issuer, audience, JWKS, MFA assertion, the groups claim, and the admin-console client id.
* - `classification`
  - The ordered data-classification ladder used by the egress gate.
* - `egress.allowlist`
  - **Deny-by-default** list of authorized destinations and the classifications each may receive.
* - `policy`
  - Per-group and per-user grants: `allowedTiers`, `allowedModels`, `allowedTools`/`deniedTools` (MCP, `server/tool` or `server/*`), `budgets`, rate limits, `admin`, and `maxClassification`.
* - `audit`
  - `sqlite` (always) plus optional `syslog`/SIEM forwarding. Fail-closed by default.
* - `metrics`
  - Prometheus `GET /metrics` (bounded labels — no principal ids). Off unless `enabled: true`; guard with a static bearer (`bearerEnvKey`) and/or network placement, since scrapers can't do OIDC.
* - `resilience`
  - Per-provider circuit breaker: `circuitThreshold` (consecutive failures before a provider trips open, default `5`), `cooldownSec` (before a half-open probe, default `30`), `healthIntervalSec` (active model-list checks; `0` = passive, the air-gapped default). A dead provider fails fast to the next authorized model; state shows on **Monitor → Provider health** (`GET /admin/api/health`).
* - `mcp`
  - Governed MCP tool gateway. `{ "enabled": true, "servers": [{ "name", "url", "authorizedClassifications", "authEnvKey"? }] }`. Servers must be in-boundary; tools are **deny-by-default** per principal via `policy.allowedTools`. Off unless `enabled: true`.
* - `tls`
  - `frontend` (terminate at a FIPS-validated proxy — recommended) or `native`.
```

```{admonition} Keep trackJti off
:class: warning
`oidc.trackJti` enforces **single-use** tokens. Standard OIDC access tokens are multi-use bearer tokens, so leaving it on rejects the second request that reuses a token. Only enable it if your IdP issues one-time tokens.
```

## Reload without restart

Edit the config, then have an admin POST to reload — the new config is re-validated (fail-closed) before it's applied:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" https://secrouter.example.url/reload-config
```

Policy and tier→model edits made in the **admin console** apply live without a reload.
