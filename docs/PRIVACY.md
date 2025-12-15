# Privacy Policy (reference)

This file mirrors the in-app `/privacy` page and exists to make the repository review recruiter-friendly.

> Updated at: see in-app `/privacy` page for the current effective date.

## Summary

Workflow Copilot AI is a portfolio project that stores only what it needs to provide the workflow features (Inbox, Weekly notes, optional Slack posting).

## Data we collect

- **Account data (via GitHub OAuth)**: a stable user identifier and basic profile fields provided by the OAuth provider (e.g. name, avatar).
- **User-generated content**: tasks, weekly notes/reports, and related metadata you create in the app.
- **Operational metadata**: minimal logs and error information for debugging and reliability (optional Sentry if enabled).

## How we use data

- **Provide core features**: saving tasks, weekly notes/reports, and “Next step” focus.
- **Authentication**: verifying your session and scoping access by user.
- **Improve reliability**: debugging and error monitoring (when enabled).

## Security

- Data is stored in Postgres via Prisma.
- Access is scoped by `userId` in server-side reads/writes.
- For production deployments, `npm run preflight:prod` is intended to prevent unsafe flags (e.g. `AUTH_BYPASS=1`) from being enabled.

## Data deletion

This app is a portfolio project and does not provide a fully automated self-serve deletion flow yet.

- **If you self-host**: you control the database and can delete your user record to cascade related data (see Prisma schema `onDelete: Cascade`).
- **If you deploy to Vercel**: you control the database and can delete data directly.

## Contact

For questions about data handling in this repository, contact the repository owner.


