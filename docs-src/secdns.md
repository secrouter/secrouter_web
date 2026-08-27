# secdns — internal authoritative DNS

**secdns** is a small, zero-dependency (standard library only) authoritative DNS server that
serves an internal zone so the suite's components resolve each other by name across hosts —
so a multi-host deployment gets real name resolution instead of scattered `/etc/hosts` edits.

## What it does

- **Authoritative** for one internal zone (default `sec.internal`), answering `A` / `AAAA` /
  `TXT` from a simple zone file, with correct `NXDOMAIN` / `NODATA` resolver behavior.
- **Forwards** non-internal queries to upstream resolvers, or **refuses** them when no upstream
  is configured — the closed-network default, so nothing leaks out.
- **UDP + TCP** on port 53, with **live reload** (`kill -HUP` or the console's *Reload* button)
  and no downtime.
- **Status console** — a tiny HTTP page with the served records, live query stats, and
  `/health` for probes.
- In the suite, **SecDeploy generates the zone file** from your `topology.toml` — one record
  per component, pointing at wherever it's actually hosted.
- **Tamper-evident audit** — lifecycle events (start/stop, zone load/reload — never per-query)
  are recorded to a hash-chained JSONL log.

## Quickstart

```bash
uv sync
cp zones/secdns.zone.example zones/secdns.zone
uv run secdns serve --domain sec.internal --zone zones/secdns.zone \
  --upstream 1.1.1.1 --port 5353

dig @127.0.0.1 -p 5353 secrouter.sec.internal
```

## Learn more

- **[secdns on GitHub](https://github.com/secrouter/secdns)** — source, issues, releases.
- **[secdns docs](https://github.com/secrouter/secdns/tree/main/docs)** — the config reference,
  zone file format, console, deployment, and control validation.
