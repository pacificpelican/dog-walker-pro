<p align="center"><img src="assets/logo.svg" alt="Dog Walker Pro logo" width="140"></p>

# Dog Walker Pro

A top-down pixel-art open-world game: walk dogs and birds around a small city, chat with NPCs, buy coffee and hats.
Plain ES modules and a canvas on the front end, with a small PHP backend for accounts and saves. There is no build step.

Created by [Daniel McKeown](https://altaredwood.work).

## Run

```
php -S localhost:8000 router.php
```

Then open http://localhost:8000. On Apache or nginx with PHP, just serve the folder. `.htaccess` files protect `data/` and `lib/`.

## Controls

| Control | Key | Action |
|---|---|---|
| D-pad | Arrows / WASD | Move |
| + (green) | E | Interact, buy coffee, return an animal, **pet** while walking |
| x (blue) | X | Change hat, **encourage** while walking |
| / (yellow) | T or / | Talk to the nearest NPC |
| - (red) | H or - | Cause trouble (don't) |

The on-screen controller works with touch, with multitouch and sliding across the D-pad.

## Customizing the world

`js/layout.js` is pure data: the grid size, street pitch, traffic probabilities per street/block, and the list of
buildings (type, color variation, job types) and landmarks. A world-builder tool only needs to emit this structure.
Content tables for dogs, birds, hats, NPC personas and buildings are in `js/data.js`.

## Configuration (`config.php`)

- **Storage**: by default a JSON file store in `data/` is used. Fill in the `mysql` settings (host, db, user, password)
  to store accounts and saves in MySQL/MariaDB instead (needs PHP `pdo_mysql`). The Settings > Debug tab shows which is active.
- **AI chat**: set the Ollama URL and model. If the server is unreachable, NPCs reply with scripted lines.

## Notes

- Local storage mode is a JSON file because many PHP installs lack `pdo_sqlite`.
- The MySQL path has not been tested against a live server.
