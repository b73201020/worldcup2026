# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**worldcup2026** is an interactive web application for predicting 2026 FIFA World Cup knockout stage matches. Users view a tree-bracket structure showing 16 teams across 5 stages (16強賽 → 8強賽 → 準決賽 → 決賽 → 冠軍), **click teams directly** to select winners, and watch predictions automatically propagate through the bracket. Predictions can also be printed via a dedicated print stylesheet.

**Key characteristic**: Pure client-side application—no backend, no build step, no dependencies. All data persists via LocalStorage.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (vanilla, no frameworks, no modules — all scripts share the global scope)
- **Data Storage**: LocalStorage (key: `worldcup2026_bracket`)
- **Images**: PNG flag files in `assets/img/` (16 countries, ~2KB each)
- **Deployment**: Static files served via any HTTP server
- **No dependencies**: No npm, no build tools, runs immediately

## Development Workflow

### Run locally
```bash
python -m http.server 8000
# or: npx http-server
# then open http://localhost:8000
```
There is no build/lint/test tooling in this repo — verify changes by reloading the browser and checking the DevTools console (F12). When editing JS, `node --check <file>` is a fast way to catch syntax errors before reloading the browser.

### Reset predictions during testing
```javascript
// in browser devtools console
localStorage.removeItem("worldcup2026_bracket");
location.reload();
```
(Or use the in-app "🔄 重置" button, which does this correctly.)

## Architecture

### Data flow (bracket-data.js → bracket-storage.js → bracket-app.js)

```
16強賽(8場) → 8強賽(4場) → 準決賽(2場) → 決賽(1場) → 冠軍
round16    → quarterfinal → semiFinal  → final     → champion
```

`BRACKET_DATA` (in `bracket-data.js`) holds all match state. Match IDs follow `<stage>_<n>` (`r16_1`…`r16_8`, `qf_1`…`qf_4`, `sf_1`, `sf_2`, `f_1`). A match object is `{ id, team1, team2, winner }` where team is `{ name, code }` or `null`, and `code` looks up a flag image in the `FLAGS` object.

**`PROGRESSION`** maps every match ID to where its winner goes next: `{ stage, matchId, position }`. `f_1` maps to `{ stage: "champion", matchId: null, position: 1 }` as the terminal case.

**Click → propagate flow**: `selectWinnerDirect(match, team)` in `bracket-app.js` → `BracketStorage.savePrediction(matchId, team)` → `updateNextRound(matchId, team)` inserts the winner into the next match's `team1`/`team2` slot per `PROGRESSION`. If that slot already held a *different* team AND the next match already had a winner, that stale winner is cleared and the invalidation cascades forward via `clearDownstream()` (recurses until it hits a match with no winner, or reaches `champion`).

**Click → cancel flow**: clicking the *currently selected* winner again calls `BracketStorage.cancelPrediction(matchId)`, which nulls that match's winner and calls `clearDownstream(matchId)` to wipe the team slot(s) and any further winners it fed into. This is what makes changing/undoing a pick safe — it never leaves stale data in later rounds.

Every mutation ends with `BracketStorage.saveBracket()` → `localStorage.setItem(...)`, and `renderBracket()` is called afterward to redraw all five stages from `BRACKET_DATA`.

### Naming gotcha: `semiFinal` vs `semifinal`

This is the single most common source of bugs in this codebase. Keep these straight:

| Context | Spelling |
|---|---|
| `BRACKET_DATA` property | `semiFinal` (capital F) |
| HTML element id / CSS selector | `semifinal` (lowercase) |
| Match ID prefix | `sf` (e.g. `sf_1`) |

`findMatchById()` in `bracket-data.js` maps prefix `'sf'` → data key `'semiFinal'`. `renderSemiFinal()` in `bracket-app.js` maps DOM `getElementById('semifinal')` → data key `BRACKET_DATA.semiFinal`. If you ever see `BRACKET_DATA.semifinal` (lowercase) referenced anywhere, that's a bug — the property doesn't exist under that name and `.forEach()`/`.find()` on it will throw, silently aborting whatever render/reset function called it (and everything after it in that function, since JS exceptions are uncaught here).

### Tree-bracket layout (styles.css)

The bracket isn't drawn with fixed pixel positions — the tree-converging visual (later rounds' cards vertically centered between the pair of matches feeding into them) comes entirely from proportional flexbox sizing:

- Each stage `.matches-column` is `flex:1` inside an equal-height `.bracket-column` (heights are forced equal via default flex `align-items: stretch` on `.bracket-container`, so every column stretches to match round16's — the tallest — natural height).
- Each match is wrapped in a `.match-slot` (`flex:1`) via `createMatchSlot()` in `bracket-app.js`. Because round16 has 8 slots, quarterfinal 4, semifinal 2, final 1 — all dividing the *same* total column height — each round's slot height is exactly double the previous round's. That's what makes a quarterfinal card land vertically centered between its two feeder round16 cards, and so on up to the champion box.
- **Do not add `gap` or `margin` between `.match-slot` siblings** — any non-proportional spacing breaks the doubling relationship and misaligns the connector lines. Use `padding` on `.match-slot` instead (padding is symmetric top/bottom so it doesn't shift the slot's center).
- Connector lines are drawn with `::before`/`::after` pseudo-elements on `.match-slot`, keyed off `:nth-child(odd)` (top of a pair) vs `:nth-child(even)` (bottom of a pair) — see the `--connector-gap` CSS variable and the `.with-connector` / `.final-connector` classes on each `.matches-column` in `index.html`. `.with-connector` is used for round16/quarterfinal/semifinal (they draw a bent connector into the next round); `.final-connector` draws a single straight line from the final into the champion box.
- `--connector-gap` also drives `.bracket-container`'s column `gap`, so they must move together — don't hardcode a different gap value on the container.

### Print stylesheet (assets/css/print.css)

Loaded via `<link rel="stylesheet" href="assets/css/print.css" media="print">` — only applies when printing/print-previewing, never on screen. It intentionally reuses the *same* tree structure and connector-line CSS as the screen view (does not fall back to a simple list) and just rescales it: `@page { size: A4 portrait; margin: 8mm }`, a much smaller `--connector-gap`, and shrunk fonts/flags/padding so all 5 columns fit the narrower portrait width. If print orientation or paper size needs to change, edit the `@page` rule and re-tune `--connector-gap` plus the card/flag/font sizes together (they all interact to determine whether 5 columns fit the printable width and 8 round16 slots fit the printable height).

## Key Files

- **`bracket-data.js`** — state (`BRACKET_DATA`), routing (`PROGRESSION`), flag lookup (`FLAGS`), and pure data-layer functions (`findMatchById`, `updateNextRound`, `clearDownstream`). No DOM access here.
- **`bracket-storage.js`** — `BracketStorage` static class wrapping `BRACKET_DATA` + localStorage: `savePrediction`, `cancelPrediction`, `resetBracket`, `saveBracket`, `loadBracket`. Auto-loads on `DOMContentLoaded`.
- **`bracket-app.js`** — all DOM rendering and event wiring (window-scoped functions, no exports). `renderBracket()` is the master re-render; `createMatchCard()`/`createMatchSlot()` build one match's DOM and wire up click/hover handlers directly on the team elements (there is no per-card click listener — each `.team` div gets its own listener, and clicking is enabled whenever both teams are known, *including* on an already-decided match, so re-picking or cancelling always works).
- **`styles.css`** — screen layout, including the flex-based tree/connector-line system described above, plus dark mode (`prefers-color-scheme`) and responsive breakpoints (1024px, 768px, 480px). Note `--connector-gap` is overridden inside the 1024px/768px media queries — don't reintroduce a hardcoded `gap` on `.bracket-container` in those blocks.
- **`print.css`** — print-only overrides, see above.
- **`index.html`** — static shell; the modal markup (`#teamModal`) and `openTeamModal()`/`selectWinner()` in `bracket-app.js` are legacy/unused (superseded by direct-click selection) but still present.

## Constraints

- No backend — predictions are per-browser/per-device only (LocalStorage).
- No build step — edit files directly, no transpiling/bundling/minification.
- Adding a team/stage: update `BRACKET_DATA` in `bracket-data.js`, the `PROGRESSION` routing, the matching `<div class="matches-column">` in `index.html`, and a `render*()` function in `bracket-app.js` called from `renderBracket()`. Keep the `semiFinal`/`semifinal` naming convention (data key camelCase, DOM id lowercase) consistent with whatever new stage you add.
