# SecCert — internal ACME certificate authority

**SecCert** is a self-hosted [ACME](https://datatracker.ietf.org/doc/html/rfc8555) (RFC 8555)
certificate authority for closed and air-gapped networks. Point any standard ACME client
(certbot, acme.sh, Caddy, Traefik, lego, `step`) at it and your internal services get
short-lived, auto-renewing certs from a CA you run and trust — a tiny Let's Encrypt for your
`.mil`/`.internal` network, with no path to the public internet required.

It's deployed first on every suite target, as the internal CA every other component trusts.

## What it does

- **Standards-based** — real RFC 8555. Existing ACME clients work unmodified.
- **Two-tier PKI** — a self-signed Root signs an Intermediate; only the Intermediate signs
  leaves. Publish the Root once as your enclave's trust anchor.
- **Fully offline** — key generation, issuance, and validation all happen in-network. No
  telemetry, no external calls.
- **Small and auditable** — Python + FastAPI + `cryptography`, one container, SQLite state,
  and a hash-chained, tamper-evident issuance ledger.
- **Admin console** at `/admin` — list and inspect issued certificates, revoke, download the
  Root, and see CA info. Gated by a bearer token, or optionally SecSSO login.

## Quickstart

```bash
docker run -d --name seccert \
  -p 14000:14000 \
  -v seccert-data:/var/lib/seccert \
  -e SECCERT_EXTERNAL_URL=http://ca.internal.example:14000 \
  ghcr.io/secrouter/seccert:latest
```

On first boot SecCert generates the Root + Intermediate and prints the admin token — grab the
trust anchor at `/ca.crt` and point an ACME client's directory at `/acme/directory`.

## Learn more

- **[SecCert on GitHub](https://github.com/secrouter/seccert)** — source, issues, releases.
- **[SecCert docs](https://github.com/secrouter/seccert/tree/main/docs)** — deployment, ACME
  client integration, trust-anchor distribution, security posture, and the full environment
  variable / endpoint reference.
