# Kith — notes for Claude

Kith is a private relationship map (people, free-placement drag-to-connect threads, notes read by Claude, questions answered by Claude). See README.md for features.

## The live app

- Published as a claude.ai artifact: https://claude.ai/artifact/H9b3EVFHtbr1E5BkgF32oW
- Declared capabilities: `{"db": {}, "user": {}, "sample": {"images": true}, "downloads": true}`. Passing `capabilities` replaces the whole set, so restate all of it.
- Home screen: the owner saves the artifact link from Safari (Share → Add to Home Screen). It opens full screen with Claude's icon; that trade-off was chosen on purpose. A custom icon is only possible from another site, and iOS then shows claude.ai in a browser-style window instead of full screen. `kith/index.html` (GitHub Pages, https://roygeiger1-dev.github.io/Connection/kith/) is that custom-icon page: it redirects to the artifact when launched from the home screen and shows save steps in a normal tab, and it must never rewrite its own URL. It is kept but deliberately not linked from the app's menu.
- Logo: the K-node mark (stem = you, teal friend and amber family threads ending in two people, yellow highlighter node). It's inline SVG in `src/markup.html` (top bar, loader) and `icons/icon.svg` (dark tile); re-render the PNGs from `icons/icon.svg` at 192, 512 and 180 (apple-touch-icon) after changing it, and bump `CACHE` in `sw.js`.
- WhatsApp Web sync: `.claude/skills/whatsapp-web-sync/SKILL.md`. It runs only in a session on the owner's computer with a browser tool. It reads the WhatsApp Web chat list and writes `lastContact` and `log` into the artifact `db` with `ArtifactData`. The in-app chat-export sync covers everything else.
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
- Keep in touch: `dueInfo`, `renderDueBanner` (top-left banner), red `.ring` on due people in `fillNode`, `birthdayInfo`, `logTouch`, `setCadence`, `touchSection`; person fields `cadence` (days), `cadenceFrom`, `lastContact` (YYYY-MM-DD), `log` ([{d, note}], newest first), `birthday` ("YYYY-MM-DD" or "--MM-DD"), `link`.
- Contact import: `parseVCards`, `parseCSV` + `csvToContacts` (Google, Outlook, LinkedIn headers), `applyImport` (new people in a grid beside the map; existing people only get empty fields filled).
- WhatsApp: `parseWhatsApp` (iOS `[d/m/y, h:m:s] Name: text` and Android `d/m/y, h:m - Name: text`; day/month order from parts > 12, then no-future + time order, then dots/locale), `unzipChat` (iOS .zip → `_chat.txt` via `DecompressionStream`), `waTitle` (name from the file name), `waMatch`, `waWhoIsMe`, `waStats` (last day you both wrote; median gap → suggested cadence), `VIEWS.waHelp`, `VIEWS.waReview`, `applyWhatsApp` (sets `lastContact`, adds a `WhatsApp` log entry, optional cadence; messages are never stored), `waNote` → `readNote` for the optional Claude pass. `waButton`/`waNumber` make wa.me links (local numbers borrow the owner's country code) and `waOffer` offers to log the catch-up on return.
- Panels: `VIEWS.*` (person, rel, relEdit, personEdit, pick, search, review, ask, menu, touch, logTouch, importHelp, importReview, waHelp, waReview).
