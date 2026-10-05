This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Bentonville analytics reports

Server API:

- Route: `GET /api/reports/bentonville`
- Query params:
  - `emailDomain` (default: `@bentonvillek12.org`)
  - `start` ISO timestamp (default: `2025-09-09T17:00:00.000Z`)
  - Optional `userId` or `email` to restrict to a specific user

This endpoint uses the Supabase service role. Ensure `SUPABASE_SERVICE_ROLE_KEY` is present in your `.env.local` and the app is running.

Python plotting script:

- Path: `scripts/analytics/bentonville_reports.py`
- Requirements: `python3`, `pip install requests pandas matplotlib seaborn`
- Usage examples:
  - General (all matching users):
    ```bash
    python3 scripts/analytics/bentonville_reports.py \
      --base-url http://localhost:3000 \
      --email-domain @bentonvillek12.org \
      --start 2025-09-09T17:00:00.000Z \
      --outdir reports/bentonville
    ```
  - User-specific by email:
    ```bash
    python3 scripts/analytics/bentonville_reports.py \
      --base-url http://localhost:3000 \
      --user-email student@bentonvillek12.org \
      --outdir reports/bentonville
    ```

The script generates:

- General:
  - `time_series.png` (answered vs correct by day)
  - `domain_overall.png` and 4 windowed variants
  - `difficulty_overall.png` and 4 windowed variants
- Per-user (if email or userId provided):
  - Same set as general
  - Plus `subcategories_<domain>.png` per domain for subcategory-level bars
