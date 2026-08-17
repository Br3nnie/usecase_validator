# Corbelle Use Case Validator

A Vite/React assessment that scores an AI use case, generates a tailored insight, captures the contact in Loops, and produces a print-ready A4 report.

## Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

## Deployment configuration

Set these environment variables in Vercel:

- `ANTHROPIC_API_KEY`: Anthropic API key used by `/api/insight`.
- `LOOPS_API_KEY`: Loops API key used to upsert contacts and send the results email.
- `LOOPS_MAILING_LIST_ID`: optional Loops mailing-list ID. When present, every submitted contact is added to that list. Find the ID under **Loops → Settings → Lists**.
- `VITE_WEBSITE_URL`: the public custom URL for the validator or Corbelle website. It powers the canonical URL and the results-page website link.
- `VITE_BOOKING_URL`: the results-page booking CTA URL.

After attaching a custom domain to the Vercel project, set `VITE_WEBSITE_URL` to its full `https://` address and redeploy so the canonical tag is rebuilt.

## Printing

The results screen includes **Print / Save as PDF**. Its print stylesheet uses A4 portrait paper, removes interactive controls, preserves report colours, and separates the summary, dimension breakdown, and tailored insight onto clean pages.
