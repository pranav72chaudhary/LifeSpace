# LifeSpace manual QA checklist

Run this checklist after changes and before a portfolio presentation.

## Core interactions
- [ ] Navigate to each sidebar view and back to Overview.
- [ ] Add a task, edit it, complete it, filter tasks, and delete it.
- [ ] Add a habit, check it in and out, then delete it.
- [ ] Add a goal, adjust progress from 0% to 100%, and delete it.
- [ ] Add a note, edit it, and delete it.
- [ ] Save a quick note and reload the page.
- [ ] Change month in Calendar and check today/task markers.
- [ ] Switch dark/light appearance and reload.
- [ ] Export workspace JSON and inspect the downloaded file.
- [ ] Reset sample data and confirm the warning appears.

## Responsive and accessibility
- [ ] Check wide desktop, laptop, tablet, mobile, and narrow mobile widths.
- [ ] Confirm there is no horizontal page overflow.
- [ ] Open/close mobile navigation and navigate from it.
- [ ] Use keyboard Tab/Enter/Space to operate visible controls.
- [ ] Confirm focus indicators are visible.
- [ ] Enable reduced motion at OS level and confirm animations are reduced.
- [ ] Check text contrast and browser zoom at 200%.

## Resilience
- [ ] Reload after creating and changing items.
- [ ] Test with empty task/habit/goal/note collections.
- [ ] Test with long titles and multi-line notes.
- [ ] Test localStorage disabled or full; check console for errors.
- [ ] Test in current Chrome, Firefox, and Edge.
- [ ] Review browser console and network requests before release.

This checklist is not evidence that each test has already passed. Record actual results when testing.
