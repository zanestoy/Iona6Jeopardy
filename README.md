# Jeopardy Game

A self-contained Jeopardy-style host game designed to run on GitHub Pages.

## Files

- `index.html` - game interface
- `style.css` - appearance and responsive layout
- `game.js` - game logic and sample questions/answers

## Running locally

Open `index.html` in a modern web browser.

## Publishing with GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, and `game.js`.
3. Open **Settings -> Pages** in the repository.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.

## Replacing the sample questions

The current question data is still stored near the top of `game.js`. This keeps the game runnable by simply opening `index.html` locally without a web server.

There are six categories, each with five questions in order:

- $100
- $200
- $300
- $400
- $500

The same object structure can later be moved into a JSON question file if desired.

## Game controls

- Click a dollar value to open a clue.
- One clue is randomly assigned as the Daily Double each time a new game starts.
- For a normal clue, show the answer, select the team being scored, then choose **Correct**, **Incorrect**, or **No Score**.
- For the Daily Double, select the answering team and wager before the clue appears. The wager is then added or subtracted for that team.
- Click **Final Jeopardy** or press **F** to begin Final Jeopardy.
- Enter a wager for each team before revealing the Final Jeopardy clue.
- After revealing the Final Jeopardy answer, score each team individually as correct or incorrect.
- **Settings** changes the number and names of teams.
- **New Game** resets the board, scores, wagers, and selects a new Daily Double.
- Press **Esc** to close an open dialog.
