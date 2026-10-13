# Kith — notes for Claude

Kith is a private relationship map (people, free-placement drag-to-connect threads, notes read by Claude, questions answered by Claude). See README.md for features.

## The live app

- Published as a claude.ai artifact: https://claude.ai/artifact/H9b3EVFHtbr1E5BkgF32oW
- Declared capabilities: `{"db": {}, "user": {}, "sample": {"images": true}, "downloads": true, "mcp": {"servers": [{"server": "Google Calendar", "tools": ["create_event", "update_event", "delete_event"]}]}}`. Passing `capabilities` replaces the whole set, so restate all of it.
- The owner's people and connections live in that artifact's `db`, under each viewer's private `data/users/<id>/` collection (docs `p-…` = person, `r-…` = relationship, `p-me` = the owner). They are not in this repo. Never commit exported backups (`kith-backup-*.json`): the repo is public.

## Making a change

1. Edit `src/styles.css`, `src/markup.html` or `src/app.js` (never edit `dist/kith.html` or `index.html` by hand).
2. Build: `node scripts/build.mjs` → writes `dist/kith.html` (artifact page) and `index.html` (standalone PWA).
3. Check it: `node --check src/app.js`, then open `index.html` in a browser. With no `window.claude`, the app runs in standalone mode (localStorage, on-device parser).
4. Update the live app: read the artifact first (`Artifact` action `read` with the URL above), then publish `dist/kith.html` with `url` set to that URL so the link and the owner's data stay the same. Omit `capabilities` to keep the declared set; only pass it if it really changes.
5. Commit and push.

## Code map (src/app.js)

- Storage: `CloudStore` (artifact db, per-doc write queue) and `LocalStore` (browser storage); chosen in `boot()`.
- Claude: `initAI`, `parsePrompt` + `normalizeDraft` (notes → reviewable draft), `ASK_RULES` + `runAsk` (questions).
- Fallbacks without Claude: `parseLocal` (rule-based note reader), `answerLocal`.
- Map: `renderNodes`, `renderEdges`, `layoutLabels`, `applyFocus`, pointer handlers `onDown/onMove/onUp`, `tidy`.
- Keep in touch: `dueInfo`, `birthdayInfo`, `logTouch`, `setCadence`, `touchSection`; person fields `cadence` (days), `cadenceFrom`, `lastContact` (YYYY-MM-DD), `log` ([{d, note}], newest first), `birthday` ("YYYY-MM-DD" or "--MM-DD"), `link`.
- Google Calendar: `VIEWS.calendar`, `calRow`, `calMove`, `calRemove`; person field `cal` ({id, link, date, time, rec, title, base}). Without the `mcp` capability the button falls back to a calendar.google.com template link.
- Contact import: `parseVCards`, `parseCSV` + `csvToContacts` (Google, Outlook, LinkedIn headers), `applyImport` (new people in a grid beside the map; existing people only get empty fields filled).
- Panels: `VIEWS.*` (person, rel, relEdit, personEdit, pick, search, review, ask, menu, touch, logTouch, importHelp, importReview).
