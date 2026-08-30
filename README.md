# Jeopardy Game

A self-contained Jeopardy-style game designed to run on GitHub Pages.

## Files

- `index.html` — game interface
- `style.css` — appearance and responsive layout
- `game.js` — game logic and all questions/answers

## Running locally

You can simply open `index.html` in a modern web browser.

## Publishing with GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, and `game.js`.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save.
7. GitHub will provide the Pages URL after deployment.

## Replacing the sample questions

Open `game.js` and edit `gameData` near the top.

There are six sample categories. Each category has five questions in order:

- $100
- $200
- $300
- $400
- $500

Keep exactly five questions per category for the standard 6 × 5 board.

The answer text can include HTML-like characters safely because the game displays it as text.

## Game controls

- Click a dollar value to open a clue.
- Click **Show Answer**.
- Select **Correct**, **Incorrect**, or **No Score**.
- The active team automatically advances after a scored question.
- **Settings** changes the number and names of teams.
- **New Game** resets the board and scores.
- Press **F** to open Final Jeopardy.
- Press **Esc** to close an open dialog.

## Future enhancements

The current version intentionally keeps the data model simple so custom questions can be added easily. It can later be expanded with:

- Daily Doubles
- Final Jeopardy wagering
- Per-team Final Jeopardy wagers
- Sound effects
- Question images/video
- Timer
- Team buzzers
- Double Jeopardy
- Import/export of question sets
- Persistent game state
- Full-screen host mode
