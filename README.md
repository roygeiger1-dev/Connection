# Kith

A private map of the people you know and how they're connected.

- **Free-form map.** People sit wherever you drag them. Drag the black knob on someone's photo onto another person to connect them, then say what the relationship is and describe it.
- **Add by typing, pasting or speaking.** Write a note like *"Sarah Chen runs design at Stripe in SF. She's my college roommate and her husband Mike is an architect."* Kith picks out the people, their company, location, traits and details, and how they're connected, and shows you a review before anything is saved. You can also paste a screenshot (a profile, a contact card, an org chart).
- **Ask about anyone.** *"How do I know Priya?"*, *"How is Leo connected to Theo?"*, *"Who do I know in Austin?"* Names in answers are links back to the map.
- **Every person** has a name, photo, title, company, location, traits, details, email, phone, birthday, link, a keep-in-touch rhythm and a catch-up history. **Every connection** has a type ("sister", "co-founder"), a kind (family, friend, work, partner, mentor, other — each its own thread color), a closeness and a description.
- **Keep in touch.** Choose how often you want to catch up with someone (weekly to yearly). When it's been too long their photo gets a glowing red outline and their name turns red, a "Time to catch up" banner at the top left lists them, the bell shows a count, and the Keep in touch panel lists who's due, who's coming up and upcoming birthdays. Log a catch-up (with an optional note) and the clock resets; each person keeps a history of catch-ups. Notes like *"Had coffee with Daniel today, remind me to check in every 2 weeks"* set this for you.
- **Import contacts.** Bring people in from a contacts file: iPhone or Mac Contacts (.vcf), Google Contacts or Outlook (.csv or .vcf), or LinkedIn (Connections.csv). You pick who to add; people already on the map get their empty fields filled in instead of duplicated. Names, titles, companies, cities, emails, phones, birthdays, notes, LinkedIn links and photos come across. You can also drop a file on the map or paste a contact card.
- Filter the map by kind of relationship, search, tidy the layout automatically, export and import backups.

## Where it runs

**On claude.ai (recommended).** The app is published as a private claude.ai artifact. Open it on your phone (Claude app or browser) and on your computer and you get the same map: it's stored in your own private space on that artifact, which no one else can read, even if you share the link. Claude reads your notes and answers your questions, using your Claude plan. Speech works through your keyboard's dictation (the mic key on iPhone/Android, Fn Fn on a Mac, Win+H on Windows).

**Home Screen.** Open the Kith link in Safari, tap Share → Add to Home Screen. It opens full screen and always shows the latest version. The icon is Claude's: the app lives on claude.ai, and the phone takes the icon from the site the full-screen app belongs to. (`kith/` is a page that carries the Kith icon instead, but launching from it opens claude.ai in a browser-style window rather than full screen, so the app doesn't link to it.)

**Standalone copy.** `index.html` is a self-contained, installable web app (PWA). Hosted anywhere over HTTPS (for example GitHub Pages) you can "Add to Home Screen" on your phone and "Install" on desktop. It keeps the map in that browser only (use Export/Import to move it between devices), uses the browser's built-in speech recognition for the mic button, and reads notes / answers questions with an on-device parser instead of Claude.

## Project layout

```
src/styles.css     design tokens + all styles (light and dark)
src/markup.html    page structure
src/app.js         the app: map, storage, note reader, answers, sheets
scripts/build.mjs  builds dist/kith.html (the artifact page) and index.html (standalone)
manifest.webmanifest, sw.js, icons/   standalone install + offline support
kith/              optional home-screen page with the Kith icon (not linked from the app)
```

Build after editing anything in `src/`:

```
node scripts/build.mjs
```
