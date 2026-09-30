# au-number-check

Check an Australian phone number against [EndSpam](https://www.endspam.org)'s community reports — from your terminal.

```console
$ npx github:changchunlei/au-number-check 0418 666 500

0418 666 500 — Scam call
Risk: High (100/100)
Reports: 20 from 20 independent reporters
Last reported: 2026-09-28
Carrier: TELSTRA LIMITED

Recent community reports:
  · "Sent a text within 5 minutes of listing a vehicle on Gumtree. I was suspicious & ran a check on the number & came up with the reports listed"…
  · "Called about car inspection in Werribee."

Full report history: https://www.endspam.org/number/0418666500
```

Numbers are normalised automatically — `0418666500`, `0418 666 500`, `+61 418 666 500`, and `(03) 9961 2116` all work.

## Install / run

Zero dependencies; any Node 18+ will do.

```bash
# one-off, no install
npx github:changchunlei/au-number-check <number>

# or clone
git clone https://github.com/changchunlei/au-number-check
cd au-number-check
node index.mjs <number>
```

### Options

| Flag | What it does |
|---|---|
| `--json` | Print the full API payload as JSON (for scripting) |

Exit codes: `0` record found · `1` no public record · `2` bad input · `3` network/API error — safe to use in shell pipelines.

## What "no public record" means

EndSpam only publishes a number once it has multiple independent reports that passed moderation, a resolved category, and community comments. One or two reports are deliberately **not** enough — that's the privacy bar that keeps private individuals off the site. If a number that just called you has no record, you can be the first to report it at [endspam.org](https://www.endspam.org).

## About the data

- Source: the [EndSpam public API](https://api.endspam.org) — a community-run reputation service for Australian phone numbers, focused on spam, scam, and telemarketing calls.
- Records are aggregates of moderated human reports — no call logs, no telco data, no private information.
- Live aggregate statistics (categories, carriers, numbering areas, top-reported numbers) are published daily at [endspam.org/australia-spam-call-statistics](https://www.endspam.org/australia-spam-call-statistics).

Disclosure: I run EndSpam. This CLI is a thin, dependency-free client for its public API — the same data the website shows.

## License

[MIT](LICENSE) © 2026 EndSpam contributors
