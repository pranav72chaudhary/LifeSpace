# LifeSpace — Personal Productivity OS

A responsive, client-side productivity workspace built with **HTML5, CSS3, and vanilla JavaScript**.

## Features
- Overview with daily task summary, habit check-ins, goal progress, and quick notes
- Create, complete, edit, filter, and delete tasks
- Track daily habits
- Create goals and adjust their progress
- Monthly calendar with task markers
- Create, edit, and delete notes
- Basic productivity insights and progress visualizations
- Dark/light appearance
- Local browser persistence and JSON data export
- Responsive navigation and layouts
- Keyboard-accessible controls, focus states, and reduced-motion support

## Run locally
1. Extract the ZIP.
2. Open the `LifeSpace` folder in VS Code.
3. Open `index.html` in a browser. A local static server (such as the VS Code Live Server extension) is recommended for a more realistic development workflow.
4. No package installation or build step is required.

## Project structure
```text
LifeSpace/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
│   └── README.md
├── data/
│   └── README.md
└── docs/
    └── QA-CHECKLIST.md
```

## Data and privacy
Workspace data is saved in the current browser using `localStorage`. It is not synchronized to a server or user account. Use **Settings → Export data** to download a JSON backup. Clearing browser storage can remove local workspace data.

## Current scope and limitations
This is a functional portfolio prototype, not a production service. It has no authentication, cloud sync, external calendar integration, live weather data, or backend. Sample content is included to demonstrate the interface. The clock and calendar use the device's local date and time.

## Suggested manual QA
See [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md). Test the app in your target browsers and devices before publishing or presenting it as production-ready.
