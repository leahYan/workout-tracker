# Workout Tracker

A minimal personal workout tracker PWA. Log sets (kg × reps) per exercise during a workout, review past sessions, and see weekly/monthly summaries.

**Live app:** https://leahyan.github.io/workout-tracker/

## Features

- **Log Set screen** — one exercise at a time; last session's sets shown greyed, tap one to copy its weight/reps. Configurable weight step (±1.25 / ±2.5 / ±5 kg). Mis-logged a set? Delete it with the × on the Today card.
- **Weekly / monthly summary** — workouts, sets, and volume for the period, plus per-muscle-group progress rings.
- **History & Groups** — every session in detail, and each exercise's last 4 sessions grouped by muscle group.
- **Resumable drafts** — an in-progress workout survives closing the app; Discard abandons it, Finish saves it (dated by when the first set was logged).
- **Offline-first PWA** — service worker caches the app, so it opens with no signal. Add to home screen on Android/iOS for a full-screen app.
- **Export / Import** — all data lives in the browser's localStorage on your device; History → Export downloads a JSON backup, Import restores it.

## Structure

Everything is one dependency-free file: [`index.html`](index.html). `sw.js` + `manifest.json` + icons provide the PWA layer. No build step — open the file or serve the folder.

## Data

Stored locally per browser/origin under localStorage keys `wt.sessions`, `wt.today`, `wt.step`. Nothing leaves the device. Export a backup occasionally.
