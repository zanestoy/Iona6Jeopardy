# Jeopardy Game

A Jeopardy-style host game designed for GitHub Pages. Game questions are stored separately in `questions.json`, so you can update the content without changing the JavaScript.

## Files

- `index.html` - game interface
- `style.css` - appearance and responsive layout
- `game.js` - game logic, scoring, Daily Double, and Final Jeopardy behavior
- `questions.json` - categories, clue values, clues, answers, and Final Jeopardy content

## Editing the questions

Edit only `questions.json` for normal game-content changes.

The file structure is:

```json
{
  "categories": [
    {
      "category": "Category Name",
      "questions": [
        { "value": 100, "clue": "Clue text", "answer": "Answer text" },
        { "value": 200, "clue": "Clue text", "answer": "Answer text" },
        { "value": 300, "clue": "Clue text", "answer": "Answer text" },
        { "value": 400, "clue": "Clue text", "answer": "Answer text" },
        { "value": 500, "clue": "Clue text", "answer": "Answer text" }
      ]
    }
  ],
  "finalJeopardy": {
    "category": "Final Jeopardy Category",
    "clue": "Final Jeopardy clue",
    "answer": "Final Jeopardy answer"
  }
}
```

Each category currently requires exactly five questions. The board can contain any number of categories, although six fits the classic layout best.

The game validates `questions.json` when it loads. If a category has the wrong number of questions or a required field is missing, an error message appears on the board.

## Running locally

Because browsers normally block `fetch()` from reading a JSON file when `index.html` is opened directly with a `file://` address, run the folder through a local web server.

If Python is installed, open a terminal in the game folder and run:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Press `Ctrl+C` in the terminal to stop the server.

## Publishing with GitHub Pages

1. Upload `index.html`, `style.css`, `game.js`, and `questions.json` to the repository.
2. Open **Settings -> Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the main branch and `/ (root)`.
5. Save.

No additional setup is needed for `questions.json` on GitHub Pages.

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
