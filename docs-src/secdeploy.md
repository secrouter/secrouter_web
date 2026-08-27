# SecDeploy — release train & deployer

**SecDeploy** turns the suite's independent components into one versioned product: it pins a
compatible, tested set of component tags (a suite "bill of materials") and stands the whole
stack up on each supported target, from a single command — air-gap friendly.

## What it does

- **One suite manifest** (`suite.toml`) pins every component's version for a release, so
  deploying a suite version gives you exactly that combination on any target.
- **Optional identity & trust tier** — SecCert, SecSSO, and secdns are the "start-from-zero"
  CA/IdP/DNS stack; provide them, or drop any you already run with `--without`.
- **Multi-host placement** via `secsite.toml` — describe your hosts and which tier
  (identity / inference / gateway / collab / edge) runs where, with an interactive `configure`
  wizard (CLI or a local web page).
- **Two supported targets** — `macos` (Docker Compose eval box) and `fedora-fips` (native,
  hardened systemd services linking the system OpenSSL FIPS provider, for production).
- **Air-gapped bundles** — build on a connected host, carry one checksummed tarball into the
  enclave, and deploy offline.
- **Whole-suite operations** — backup/restore into one FIPS-encrypted archive, deploy-audit
  hash-chain verification, and a suite-wide evidence command that pulls every reachable
  component's evidence bundle into one file.

## Quickstart

```bash
uv run secdeploy verify        # validate the manifest + target assets
uv run secdeploy plan macos    # show pinned versions + steps for a target
uv run secdeploy fetch         # checkout every component at its pinned ref → ./work
uv run secdeploy deploy macos  # stand the suite up
```

## Learn more

- **[SecDeploy on GitHub](https://github.com/secrouter/secdeploy)** — source, issues, releases.
- **[SecDeploy docs](https://github.com/secrouter/secdeploy/tree/main/docs)** — get-started,
  configuring a site, per-target deploy guides, feature docs (voice, agent pool, analysis
  sidecars), and the compliance mapping.
