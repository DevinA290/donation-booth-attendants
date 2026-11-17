# Donation Booth Attendants

Shift sign-up and booth notes for donation booth attendants at the circuit assembly on Sunday, November 22, 2026.

- Static site: `index.html`, `styles.css`, `app.js` (no build step), hosted on GitHub Pages.
- Shift data: Supabase table `signups` (see `schema.sql`). The key in `app.js` is the public anon key; row level security allows only select, insert and delete.
- To add a question, add one entry to the `QUESTIONS` array at the top of `app.js`.
