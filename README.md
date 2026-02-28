# PollyWeb Site

Public website for PollyWeb.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](./LICENSE).

## Project Structure

- `index.html`: Main website page.
- `newsletters/newsletter-01.html`: Newsletter landing/content page.
- `images/`: Static image assets used by the pages.

## Run Locally

This is a static site, so no build step is required.
Serve the directory with a local HTTP server (the page loads HTML components via `fetch`, which does not work reliably with `file://`).

Example with Python:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Security Gate (Blocks Git Push)

This repo includes a local pre-push hook that blocks `git push` when security issues are pending.

One-time setup (per clone):

```bash
git config core.hooksPath .githooks
```

How it works:

- Any non-empty, non-comment line in `.security/pending-issues.txt` will block a push.
- Clear or comment out lines in `.security/pending-issues.txt` to allow a push.

## Publishing

You can deploy this site to any static hosting provider (for example: GitHub Pages, Netlify, Vercel, S3 + CloudFront, or an Apache/Nginx server).
