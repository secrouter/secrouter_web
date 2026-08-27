# SecAgent — the agentic harness

**SecAgent** pairs the [pi coding agent](https://pi.dev) (the agentic loop) with a
context-frugal toolset built for *local* models — an affordance engine that pre-computes
compact, content-addressed representations of a codebase so an agent works from a minimal,
budget-bounded context instead of raw source. pi is the runtime; SecAgent is what pi drives.

## What it does

- **Affordance engine** — a project-structure map, per-file summaries, a service/component IO
  map (imports, endpoints, calls, datastores, queues), a symbol index, and an inter-file call
  map, cached and content-addressed.
- **Docs deep-dive** (`secagent docs`) — pi loops over a codebase and builds a full Sphinx site
  with Draw.io architecture diagrams, derived deterministically from the IO map so they stay
  accurate even on small local models.
- **GitLab MR review** (`secagent review`) — reviews merge requests, posts an initial comment,
  and replies in-thread when mentioned, steered by an editable persona.
- **C/C++ static analysis** (`secagent analyze`) — runs IKOS (NASA's abstract-interpretation
  analyzer) and enriches findings with the owning component and file purpose.
- **Memory/stability scan** (`secagent scan`) — a configurable rule set (distilled from
  NASA/JPL Power of Ten, MISRA, CERT C, BARR-C) reviewed by the local model.
- **Auto test generation** (`secagent testgen`) — drafts unit tests and functional
  component I/O tests from the structure and IO map.
- **Endpoint-agnostic** — points at any OpenAI-compatible endpoint (llama.cpp, vLLM, or a
  gateway such as SecRouter); FIPS-compatible container images.

## Quickstart

Pointing at an existing SecRouter deployment, as yourself:

```bash
./install.sh                                # install secagent (+ pi, if Node is present)
secagent init --domain <your-suite-domain>  # wire up pi + secagent for that deployment
secagent login                              # authenticate as yourself (device code)
```

## Learn more

- **[SecAgent on GitHub](https://github.com/secrouter/secagent)** — source, issues, releases.
- **[SecAgent docs](https://github.com/secrouter/secagent/tree/main/docs)** — installation, the
  full-analysis / docs / review / static-analysis / scan / testgen use cases, the knowledge
  graph, and the CMMC control mapping.
