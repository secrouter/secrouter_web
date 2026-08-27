# Usage

SecRouter speaks the **OpenAI chat-completions API**, so most clients work by changing one setting: the base URL.

## Authenticate

When security is enabled, every request (except `/health`) must carry a **bearer JWT** from your IdP:

```
Authorization: Bearer <token>
```

- **Interactive users** sign in through your IdP and the client forwards the access token.
- **Machine clients** (CLI, pipelines) use the OIDC **client-credentials** grant to obtain a token.

A request with no token, an invalid token, or one missing MFA is rejected with `401`.

## Make a request

```bash
curl https://secrouter.example.url/v1/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "model": "auto",
        "messages": [{"role": "user", "content": "Summarize this contract clause…"}]
      }'
```

Use `"model": "auto"` to let the classifier choose, or name a specific model to pass through (subject to your allowlist).

Streaming works as usual — set `"stream": true` and read the SSE response.

## Smart routing & overrides

With `auto`, a weighted classifier scores each request and routes to the cheapest capable tier. Override it inline when you know better — the prefix is stripped before the model sees it:

```text
/simple   What's 2+2?
/max      Analyze this distributed system for race conditions
[complex] Refactor this module to use dependency injection
deep mode: Why does this recursive CTE produce duplicates?
```

| Aliases | Tier |
|---|---|
| `simple`, `basic`, `cheap` | SIMPLE |
| `medium`, `balanced` | MEDIUM |
| `complex`, `advanced` | COMPLEX |
| `max`, `reasoning`, `think`, `deep` | REASONING |

## Routing experiments

Two independent, off-by-default features, configured under `experiments` in
`secrouter.config.json`. Both are validated fail-loud at startup/reload — an invalid block
refuses to (re)load rather than silently misrouting live traffic.

### Split (A/B) routing

Assign a tier's traffic across two or more candidate models by weight, e.g. to benchmark a new
model against the incumbent:

```json
"experiments": {
  "split": {
    "enabled": true,
    "name": "sonnet-vs-candidate",
    "tiers": {
      "MEDIUM": {
        "variants": [
          { "model": "azure/gpt-4o", "weight": 90 },
          { "model": "bedrock/openai.gpt-oss-120b-1:0", "weight": 10 }
        ]
      }
    }
  }
}
```

Every non-`EXPLICIT` request that resolves to that tier is weighted-randomly assigned a
variant. Read the assignment back from the `X-SecRouter-Split` response header, the Access
Log's `route.decision` events, or the `secrouter_split_assigned_total{tier,model}` Prometheus
counter. A per-user policy denial/downgrade still overrides the assignment — split runs before
both health-aware steering and policy authorization.

### Escalation routing

Draft cheap, judge the draft, and escalate to a stronger tier only when needed:

```json
"experiments": {
  "escalation": {
    "enabled": true,
    "fromTiers": ["SIMPLE"],
    "toTier": "MEDIUM",
    "judge": { "mode": "heuristic", "timeoutMs": 10000, "minDraftChars": 1 }
  }
}
```

For a matching, non-streaming request, SecRouter drafts a response on `fromTiers`, then judges
it (`heuristic` — empty/truncated/refusal-matched/too-short draft; or `model` — a rubric prompt
that fails open to *accept* on timeout or unparseable output). An accepted draft is served as-is
(`X-SecRouter-Escalation: accepted`); an escalated request is re-authorized and forwarded fresh
to `toTier` (`X-SecRouter-Escalation: escalated`, `X-SecRouter-Tier` becomes `toTier`) — or, if
`toTier` has no model or policy denies it, the draft is served instead
(`escalation_denied`). Escalation never fires on `stream: true` or `EXPLICIT` (pinned-model)
requests. Every draft, accept, escalate, and denial is an audited event, alongside the
`secrouter_escalations_total{from_tier,to_tier,outcome}` metric.

Split and escalation compose: split resolves which model a tier's chain starts with, and
escalation then drafts on that chain before deciding whether to escalate.

## Embeddings

`POST /v1/embeddings` is governed exactly like chat — same OIDC auth, per-user model policy, classification clearance, deny-by-default egress, quota, and per-user cost accounting — so RAG pipelines run **through** the control plane instead of around it.

```bash
curl https://secrouter.example.url/v1/embeddings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "model": "auto", "input": "text to embed" }'
```

`"model": "auto"` uses the configured `embeddings.default`; or name an embedding model directly (subject to your allow-list). Register embedding models from the console's *add endpoint* wizard by ticking **embedding** on the discovered models.

## MCP tool gateway

Point an MCP client (your IDE, an agent, or a CLI) at **`/mcp`** with the same OIDC bearer, and SecRouter brokers every `tools/list` and `tools/call` to your registered in-boundary MCP servers under the **same** governance as chat — so agentic tool use runs **through** the control plane instead of around it:

- **Deny-by-default tools.** A principal sees and can call **only** the tools granted by `policy.allowedTools` (namespaced `server/tool`, with a `server/*` wildcard). No grant ⇒ no tools, and `tools/list` is filtered so clients never even see unsanctioned tools.
- **Classification-gated.** A `tools/call` is refused unless the request's data classification is one the destination server is authorized to receive.
- **Audited, CUI-safe.** Every call is a `tool.call` (or `tool.deny`) audit event recording the server, tool, byte counts, and a **SHA-256 of the arguments** — never their contents.

Register servers under `security.mcp` (see [Configuration](configuration.md)); grant tools per group/user on the console's **Users** tab (**Allowed tools**). The gateway is off unless `security.mcp.enabled`.

```bash
curl https://secrouter.example.url/mcp \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "jsonrpc": "2.0", "id": 1, "method": "tools/list" }'
```

## Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `POST /v1/chat/completions` | user | Route & forward (OpenAI-compatible) |
| `POST /v1/embeddings` | user | Governed embeddings (OpenAI-compatible) |
| `POST /mcp` | user | Governed MCP tool gateway (off unless `security.mcp.enabled`) |
| `GET /v1/models` | user | List configured models |
| `GET /v1/usage` | user | Your own token / cost usage |
| `GET /health` | open | Liveness probe |
| `GET /metrics` | bearer / none | Prometheus metrics (off unless `security.metrics.enabled`) |
| `GET /admin` | open shell | Admin web console (OIDC PKCE login) |
| `GET /admin/usage`, `/admin/api/*` | admin | Org usage + policy/model config |
| `GET /stats`, `/config`, `POST /reload-config` | admin | Operations |

## See your usage

Any user can check their own spend:

```bash
curl -H "Authorization: Bearer $TOKEN" https://secrouter.example.url/v1/usage
```

```json
{
  "principal": "alice@example.url",
  "usage": { "last24h": { "requestCount": 12, "inputTokens": 30400, "costUsd": 0.21 } },
  "budgets": [{ "window": "day", "maxCostUsd": 25 }]
}
```

When a budget or rate limit is exceeded, requests return `429` until the window rolls over.

## Admin console

Browse to **`/admin`** and sign in (OIDC PKCE). Admins can:

- **Monitor** per-user / model / day usage and cost, plus **provider health** — the circuit-breaker state of each upstream (healthy / open / half-open), so a failing endpoint is visible at a glance.
- **Configure** group and per-user policies and tier→model routing — changes are written to an audited overrides layer and applied live.
- **Add model endpoints** (below) — register a local / on-prem model with a guided wizard.
- **Review** the hash-chained audit trail.

## Add a local or on-prem endpoint

The **Models** tab has a guided wizard for registering a self-hosted, OpenAI-compatible model server (vLLM, Ollama, TGI, LM Studio, or any in-boundary endpoint):

1. **Connect** — enter the base URL (e.g. `http://llm.internal:8000/v1`) and auth (an env-var name, a one-time token used only for the test, or none — many on-prem servers need no key), then **Test endpoint**. SecRouter probes it and lists the models it serves.
2. **Select & price** — pick the models to register and set their `$`/M-token rates (default `0` for self-hosted compute, so per-user budgets and cost reports still apply). Optionally make one the primary for a routing tier.
3. **Set egress** — choose the data classifications this destination may receive. This writes a deny-by-default egress rule, so the endpoint is only reachable for those classifications.
4. **Validate → Apply → Reload** — SecRouter validates the change, writes it to the **config file** (atomically, with a `.bak` backup — the file stays your change-controlled source of truth), and you apply it with a no-downtime **Reload** or a full **Restart**.

Every step is admin-only and audited. The probe is restricted to in-boundary hosts by default (set `SECROUTER_PROBE_ALLOW_HOSTS` to allow others). Because a new endpoint always comes with an explicit, validated egress rule, the deny-by-default CUI boundary is preserved.

## Client integration (OpenAI SDKs)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://secrouter.example.url/v1",
    api_key=token,   # your OIDC access token
)
resp = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello"}],
)
```
