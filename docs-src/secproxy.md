# SecProxy — edge reverse proxy

**secproxy** is [nginx](https://nginx.org) wired into the suite as the `edge` tier — one HTTPS
front door. Instead of remembering a different port for every service, you reach
`https://<service>.<domain>` on a single port, **443**, and secproxy routes by Host header to
the right backend.

## What it does

- **One HTTPS port** for every fronted suite service (SecSSO, SecRouter, SecAgent, SecChat,
  SecRecorder) — SecCert, SecLLM, and secdns are deliberately reached directly instead.
- **FIPS-clean** — nginx links the host's **system OpenSSL**, so edge TLS termination runs
  through the FIPS-validated module on hardened hosts; the same nginx runs unchanged on the
  macOS eval target.
- **Generated, not hand-written** — the entire config comes from SecDeploy's
  `wiring.nginx_conf_text()` reading your `topology.toml`, in a stable, diffable order.
- **One SAN certificate** covering every fronted hostname, issued by SecCert at deploy time and
  installed for every `:443` server block; a `:80` webroot keeps ACME renewal working without
  stopping nginx.
- **No code of its own** — packaging and generated config over upstream nginx; runs as a
  hardened, non-root systemd unit on Fedora-FIPS, or natively on macOS.

## Quickstart

```bash
nginx -t -c /etc/secsuite/nginx-secproxy.conf                 # validate
nginx -c /etc/secsuite/nginx-secproxy.conf -g 'daemon off;'   # run
```

In the suite, SecDeploy generates the config and installs the unit for you — see SecDeploy's
`docs/fedora-fips.md` / `docs/macos.md`.

## Learn more

- **[secproxy on GitHub](https://github.com/secrouter/secproxy)** — source, issues, releases.
- Documentation lives inline in the repo — see
  [`nginx-secproxy.conf.example`](https://github.com/secrouter/secproxy/blob/main/nginx-secproxy.conf.example)
  for the exact config shape, and SecDeploy's docs for how site placement drives it.
