# SecSSO — single sign-on for the suite

**SecSSO** packages, brands, and pre-wires [Authentik](https://goauthentik.io) so the suite gets
OIDC single sign-on out of the box — and it's built to be **dropped** the moment you have your
own IdP (Okta, Entra, Keycloak, Ping). SecSSO and SecCert are the suite's optional "identity &
trust" tier: provide them when you have nothing, skip them when you already run an IdP.

## What it does

- A standard Authentik topology (server + worker + Postgres + Redis) via Compose, brought up
  and reported on by one control script.
- **Blueprints** pre-wire OIDC apps for every current suite component that speaks OIDC —
  SecRouter, SecAgent, SecChat, SecRecorder, and SecLLM — each with the right client id, grant
  type, and (where relevant) a `groups` scope so per-group policy works straight from the token.
- Suite **branding** on the login, consent, and device-authorization screens — the olive
  hexagon mark and IBM Plex, served from the repo so it works unchanged in an air-gapped
  enclave.
- **Declarative user onboarding** — declare users/groups once in SecDeploy's `secsite.toml` and
  get a random initial password per user plus forced password reset on first login.
- Self-contained `backup` / `restore` verbs that SecDeploy's suite-wide backup calls into.

## Quickstart

```bash
cp .env.example .env
$EDITOR .env                       # AUTHENTIK_SECRET_KEY, PG_PASS, ...
./bootstrap/secsso.sh up           # brings the stack up, prints the SecRouter OIDC config
```

Already run Okta, Entra, Keycloak, or Ping? Skip SecSSO entirely — point SecRouter's
`security.oidc` at your existing IdP instead (SecDeploy's `--without secsso` path).

## Learn more

- **[SecSSO on GitHub](https://github.com/secrouter/secsso)** — source, issues, releases.
- **[SecSSO docs](https://github.com/secrouter/secsso/tree/main/docs)** — every `.env`
  variable, production hardening (TLS, secrets, backups, MFA), and the NIST SP 800-171 control
  mapping for the identity layer.
