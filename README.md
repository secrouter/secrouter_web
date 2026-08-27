<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.png" />
    <img src="assets/logo.png" alt="SecRouter — Secure AI API Router" width="300" />
  </picture>
</p>

# SecRouter — marketing site

The landing page for [SecRouter](https://git.secrouter.io/spaceProbe/secrouter), built to the designer handoff (`Secure AI API Router Logo` bundle). Static, dependency-free, SEO-optimized.

**Design system:** warm-sand light theme (`#ece8dc`) with dark-olive bands (`#232a16`), olive accent (`#54672f`), IBM Plex Mono (headings/labels/data) + IBM Plex Sans (body). New hexagon "routing badge" logo.

## Run locally

```bash
python3 -m http.server 8000     # http://localhost:8000
```

## Deploy

Static files — host on GitHub Pages, Netlify, Cloudflare Pages, or S3/CloudFront. No build step.

## Claims — accurate to the shipped product

The copy was reworked to match what SecRouter actually does today. The original handoff's unverifiable / unbuilt claims were removed:

- **Removed:** SOC 2 Type II · flat "FIPS 140-2" · "FedRAMP — in process" · ITAR-aware · PII redaction · prompt-injection guard · SAML/SCIM · "SecRouter, Inc." · "book a briefing with our team".
- **Now claims (all real in the codebase):** OIDC SSO + MFA · per-user/group policy & model allowlists · budgets + rate limits with hard auto-cutoff · smart routing · deny-by-default egress + data-classification gate · hash-chained, metadata-only audit · self-hosted / GovCloud / air-gap · FIPS-*aware* · NIST 800-171 R2 / CMMC L3 **control mapping** (framed as alignment, not certification).
- The hero "inspected request" panel now demonstrates the real flow (authenticate → allowlist → budget → route → log) rather than redaction.

If you later earn SOC 2 / FedRAMP or ship features like PII redaction, add those claims back when they're real.

## Also before launch

1. **Replace the domain** `https://secrouter.io` in `index.html`, `robots.txt`, `sitemap.xml`.
2. **Wire the CTAs.** "Request a briefing" / "Contact" currently use a `mailto:sales@secrouter.io` placeholder — point them at your real booking/contact flow.
3. **Repo & doc hosts are placeholders.** The repo URL (`https://git.secrouter.io/spaceProbe/secrouter`) and the example host in the docs (`secrouter.example.url`) are placeholders — set them to your real git host and gateway domain.
4. ~~**Fonts (optional).** IBM Plex loads from Google Fonts. For an air-gapped/privacy-strict deploy, self-host the woff2 files and swap the `<link>` for `@font-face`.~~ **Done** — IBM Plex Mono/Sans are self-hosted from `assets/fonts/` (see [Fonts](#fonts) below); no `fonts.googleapis.com`/`fonts.gstatic.com` requests remain on the marketing site or the docs.
5. The `og-image.png` is rendered from `og-image.svg` — re-run `rsvg-convert -w 1200 -h 630 og-image.svg -o og-image.png` if you edit it.

## Structure

```
index.html     semantic page + SEO head (meta, OG, Twitter, JSON-LD), IBM Plex
security.html  security brief page
styles.css     handoff design tokens (sand + dark olive), responsive
script.js      mobile nav, sticky nav, scroll-reveal, spend count-up
og-image.svg   social card source → og-image.png
favicon.svg    hexagon routing mark on olive tile
robots.txt · sitemap.xml
assets/fonts/  self-hosted IBM Plex woff2 files (see Fonts, below)
docs-src/      Sphinx docs source (MyST markdown, Furo theme)
docs/          built docs site, served at /docs/  (regenerate; see below)
```

## Fonts

IBM Plex Mono (400/500/600) and IBM Plex Sans (400–700, a variable font) are **self-hosted**
from `assets/fonts/` — no `fonts.googleapis.com` / `fonts.gstatic.com` requests, so the site
and docs work air-gapped. `styles.css` declares the marketing site's `@font-face` rules;
`docs-src/_static/custom.css` declares the docs' own (pointing two directory levels up, from
the built `docs/_static/` to the site-root `assets/fonts/`).

To refresh the files (e.g. to add a weight or update to a newer version), fetch Google's CSS2
API with a woff2-capable `User-Agent` and pull the `url(...)` out of each `/* latin */` block:

```bash
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
```

IBM Plex Sans ships from Google as a single variable file across all four weights (the CSS
repeats the same `url()` for each `font-weight` block) — download it once and declare it with
`font-weight: 400 700;` rather than four separate files.

## Docs (Sphinx)

The product docs are a Sphinx site (Furo theme, MyST markdown) served under `/docs/`. The site's "Docs" links point to `docs/index.html`.

Rebuild after editing anything in `docs-src/`:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r docs-src/requirements.txt
sphinx-build -b html docs-src docs && touch docs/.nojekyll
```

`docs/` is committed so it deploys with the static site (no build step on the host). `.nojekyll` (repo root + `docs/`) keeps GitHub Pages from stripping the `_static/` folder.
