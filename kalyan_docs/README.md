# Vitess Learning Tutorial

A self-contained, **beginner-friendly** course that takes you from basic SQL to confidently navigating the Vitess codebase and shipping your first pull request.

Assumes only: basic SQL, a terminal, and willingness to run a few commands. We teach the rest.

## How to run

```bash
cd kalyan_docs
./start.sh
```

Spins up a small Python HTTP server on `http://localhost:8765` and opens your browser. Press `Ctrl-C` to stop.

Port already in use? `PORT=9000 ./start.sh`.

## Requirements

- Python 3 (ships with macOS; on Linux: `apt install python3` or similar)
- A modern browser (Chrome, Firefox, Safari, Edge)
- Internet on first load (reveal.js + Mermaid load from CDN; cached after)

## How to read it

- **Sidebar** — table of contents grouped into 7 parts. Filter with `Cmd/Ctrl+K`.
- **Each chapter is a slide deck.** Use arrow keys, space, `Esc` for overview.
- **Hover any dashed-underlined word** to see a glossary definition.
- **Press `g`** to open the full glossary drawer.
- **Press `?`** inside any chapter for the keyboard cheat-sheet.
- **Progress** is saved in `localStorage`; visited chapters get a checkmark.

## Curriculum (32 chapters, 7 parts)

| Part | Chapters | Theme |
|------|----------|-------|
| 0    | 1-5      | Foundations: how to read this course, SQL refresher, DB internals, Go primer, terminal & repo |
| I    | 6-11     | MySQL from a code perspective |
| II   | 12-15    | Vitess at a glance |
| III  | 16-20    | vtgate: the query router |
| IV   | 21-24    | vttablet: the data plane |
| V    | 25-30    | Sharding & VReplication |
| VI   | 31-32    | Contributing |

## Learning tracks

The home page suggests four reading paths depending on your time and goals:

- **Beginner Full Course** — all 32 chapters in order, ~8-10 hours
- **Fast Orientation** — chapters 1, 2, 7, 8, 9, 10, 27, 32 (afternoon)
- **Query Path Track** — focus on parse → plan → execute
- **Operations Track** — replication, failover, sharding, backups

## Chapter shape

Each chapter follows the same template:

1. Title + part tag
2. Learning objectives
3. Plain-English explanation
4. Visual model (Mermaid diagrams)
5. Concrete SQL or command example
6. Where it appears in Vitess code
7. Guided lab with expected output
8. Misconceptions (where applicable)
9. Checkpoint quiz with reveal-on-click answers
10. Recap
11. Further reading

## Where to go next

After finishing the course:

1. Re-read [`CLAUDE.md`](../CLAUDE.md) at the repo root — Vitess-specific conventions.
2. Spin up [`examples/local/`](../examples/local/) and break it on purpose.
3. Open an "easy" issue tagged `good first issue` on
   [github.com/vitessio/vitess](https://github.com/vitessio/vitess/issues).
4. Join the Vitess Slack (linked from the repo README).

## What this is _not_

- Not a substitute for [vitess.io/docs](https://vitess.io/docs/) — those are operator-focused
  and continuously maintained. This tutorial is **code-focused**, designed so you can navigate
  the actual files.
- Not auto-updated — code citations target the version of `main` you cloned. If you rebase
  far in the future, line numbers may drift; the file paths should still be valid.

## Files

```
kalyan_docs/
├── README.md                this file
├── start.sh                 launcher
├── index.html               home page (tracks + chapter grid)
├── chapters/
│   ├── 00-learning-path.html, 00-sql-refresher.html, ...
│   ├── 01-welcome.html ... 27-first-pr.html
└── assets/
    ├── css/style.css        all custom styling
    ├── js/
    │   ├── sidebar.js       sidebar render + search + progress
    │   ├── chapter-shell.js per-chapter chrome
    │   ├── glossary.js      hover popovers + glossary drawer
    │   └── deck.js          reveal.js + Mermaid bootstrapping
    └── data/
        ├── chapters.json    manifest (parts → chapters)
        └── glossary.json    56 terms with definitions
```
