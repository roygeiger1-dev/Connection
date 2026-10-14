---
name: whatsapp-web-sync
description: Sync the owner's WhatsApp chats into the live Kith map by reading WhatsApp Web in their own browser - who they chatted with and when - and updating each person's last-contact date and catch-up history. Use when the owner asks to sync WhatsApp, update Kith from WhatsApp, or use WhatsApp Web. Needs a session on the owner's computer with a browser tool (Claude in Chrome or the built-in browser); a cloud session cannot do it.
---

# Sync Kith from WhatsApp Web

WhatsApp has no API for personal chats, so this reads the chat list the owner sees in WhatsApp Web, in their own logged-in browser, and writes only dates into Kith. It is read-only on WhatsApp: never type, send, react, open media or change anything there.

## 0. Check you can do it

- You need a browser tool that drives the owner's browser (Claude in Chrome: `mcp__claude-in-chrome__*`; or the built-in browser). Load its skill first. A cloud session has neither: say so in one line and stop; the in-app *Sync a WhatsApp chat* (export a chat file) still works there.
- You need the `ArtifactData` tool for the live app: https://claude.ai/artifact/H9b3EVFHtbr1E5BkgF32oW

## 1. Read the map

`ArtifactData` `list` on collection `data/users/me` (limit 1000, page with `next_cursor`). Documents with `kind: "person"` are people (doc id = person id, e.g. `p-…`; `p-me` is the owner and is never updated). Note each one's `version`, `name`, `phone`, `lastContact`, `log`, `x`, `y`. Ignore `kind: "rel"` documents.

## 2. Read WhatsApp Web

1. Open or switch to https://web.whatsapp.com. If it shows a QR code, ask the owner to scan it with their phone and wait; never try to get around it.
2. Read the chat list on the left: each chat's name (or phone number when not saved) and its last-activity label. Scroll down until labels are older than the window (default: last 120 days; use what the owner asks for) or the list ends.
3. Turn labels into dates (YYYY-MM-DD, owner's local time): a clock time means today; "Yesterday"; a weekday means its most recent past occurrence; a date is day-first in Israel (`13/10/2026`, `13.10.2026`) - check one known chat if unsure.
4. Skip group chats, communities, channels, broadcast lists, the owner's own "message yourself" chat, and businesses or automated senders (banks, deliveries, OTP codes). Skip archived chats unless asked.
5. Read only the list. Do not open chats or read message text unless the owner asks for details about a specific person.

## 3. Match chats to people

For each chat, in this order:
- Phone shown: match a person whose `phone` has the same last 9 digits.
- Name: match case- and accent-insensitively, ignoring emoji (`Sarah 🌸` = `Sarah`). A first name alone, or first name + initial, matches only when exactly one person fits.
- Unmatched: collect them.

Before writing, ask the owner about each person as a yes/no question, most recent chat first: "Sync Daniel Reyes? Last chatted 3 days ago" for matched people, "Add Dana Cohen (new)? Last chatted yesterday" for unmatched ones. Use `AskUserQuestion` with Yes / No options, up to 4 questions per call, and cap it at 40 people unless the owner wants more. Only the yeses get written.

## 4. Write

One `ArtifactData` `batch` (up to 50 writes per call; split if more), every existing document pinned with its `if_version`:

- Matched person, only when the chat date is newer than their `lastContact` (or they have none): `update` with `lastContact` = the date, `log` = `[{ "d": date, "note": "WhatsApp" }, ...old log]` sorted newest first, at most 60 entries, skipping it if an entry already has that date, and `updatedAt` = now in ms.
- New person: `set` a new doc id `p-` + 10 random lowercase letters/digits, with `{ "kind": "person", "name", "title": "", "company": "", "location": "", "traits": [], "details": "", "email": "", "phone": <number if the chat showed one, else "">, "link": "", "birthday": "", "photo": "", "cadence": 0, "cadenceFrom": "", "lastContact": date, "log": [{ "d": date, "note": "WhatsApp" }], "x", "y", "createdAt": now ms, "updatedAt": now ms }`. Place new people in rings around `p-me`'s `x`,`y`: radius 260, then 400, 540…, about 170 px apart along each ring, away from existing people.

Never write message text, never delete anything, never touch `p-me` or relationships.

## 5. Report

One short message: how many people were updated (with dates), how many added, and what was skipped. The owner sees the changes as soon as they open or refresh Kith; people whose reminder is overdue get the red outline.
