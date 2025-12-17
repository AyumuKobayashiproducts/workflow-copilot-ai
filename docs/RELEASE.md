## Release

This repo uses a lightweight release process suitable for small products / portfolios.

### 1) Update changelog

- Move items from `Unreleased` to a version section (e.g. `1.0.0 - YYYY-MM-DD`) in `docs/CHANGELOG.md`.

### 2) Tag the release

```bash
git tag -a v1.0.0 -m "v1.0.0"
git push --tags
```

### 3) Create a GitHub Release (recommended)

In GitHub:

- Open **Releases** → **Draft a new release**
- Pick tag: `v1.0.0`
- Title: `v1.0.0`
- Notes: paste the `1.0.0` section from `docs/CHANGELOG.md`

### 4) Verify CI & demo

- Ensure GitHub Actions CI is green.
- Ensure the demo URL in README is live.

