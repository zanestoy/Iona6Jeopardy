# Jeopardy Host Game

This version includes a complete three-stage game:

1. **Jeopardy** — 6 categories × 5 clues, with 1 randomly placed Daily Double.
2. **Double Jeopardy** — 6 new categories × 5 clues, with 2 randomly placed Daily Doubles.
3. **Final Jeopardy** — each team wagers before the clue is shown, then each team's wager is scored independently.

## Round 2 value setting

Open **Settings** and choose either:

- **Same as Jeopardy** — $100, $200, $300, $400, $500
- **Double** — $200, $400, $600, $800, $1,000

The default is **Double**.

## Question file

All clue content is stored in `questions-v2.json`. It now uses this structure:

```json
{
  "rounds": [
    {
      "name": "Jeopardy",
      "categories": [ ... ]
    },
    {
      "name": "Double Jeopardy",
      "categories": [ ... ]
    }
  ],
  "finalJeopardy": {
    "category": "Category",
    "clue": "Clue text",
    "answer": "What is ...?"
  }
}
```

Each round must contain exactly 6 categories, and each category must contain exactly 5 clues.

The included file contains 60 general-trivia clues plus Final Jeopardy.

## Daily Doubles

Daily Doubles are reassigned randomly each time **New Game** is started:

- Round 1: 1 Daily Double
- Round 2: 2 Daily Doubles

The maximum wager is the greater of the team's positive score or the highest clue value in the current round.

## Running locally

Because the game loads `questions-v2.json` with `fetch()`, run it through a local web server rather than double-clicking `index.html`.

From the game folder:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

It also works normally when hosted with GitHub Pages.


## Cache-proof update

This build uses `game-v2.js` and `questions-v2.json` so browsers and GitHub Pages cannot accidentally reuse the previous single-round JavaScript from cache. Upload all files from this package together.

## Optional round timers

Game Settings now includes a separate optional timer for Jeopardy and Double Jeopardy.

- Enable either round timer independently.
- Set each timer from 1 to 120 minutes.
- Entering a round resets its clock, but the clock does not begin automatically.
- Press **Start Round Timer** when the host is ready. The same button can pause and resume the timer.
- At 1:00 remaining, the timer display changes to a warning state.
- At 0:00, the game automatically advances to the next round (or Final Jeopardy after Double Jeopardy).
- **Next: Double Jeopardy** and **Next: Final Jeopardy** remain available at all times so the host can end a round early.
