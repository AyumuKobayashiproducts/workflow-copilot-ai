## Screenshots

This directory is the target output for the Playwright screenshots config.

Generate screenshots locally (defaults to Japanese UI):

```bash
npm run screenshots
```

Optional (force English UI):

```bash
SCREENSHOTS_LOCALE=en npm run screenshots
```

Expected outputs:

- `home.png`
- `inbox.png`
- `weekly.png`

If you want to commit screenshots, add them as normal image files in this directory.


