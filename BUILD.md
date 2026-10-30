# Building Kip vs. Spectator Mode

- **The 3D world** is one canvas in `index.html`, drawn from timeline time on `hf-seek` by `assets/film/world.js`
  (renderer, Kip's house, the cast, the ghost pass). The shots that pose it are `assets/film/scene*.js`, one entry per
  SPEC.md shot at its planned time: `pose(w, lt, t)` with `w.frameOn(...)` / `w.cam(...)` for the camera.
  `assets/film/shots.js` lists the scenes built so far; `assets/film/screens.js` draws the TV.
- **The Kip kit** lives in `Animations/mascot/` (`mascot.js`, `cat.js`, `studio.js`, `house.js`). Improve it there, then
  copy it in: `node scripts/sync-kit.cjs`. three.js r169 is vendored in `assets/vendor/three/`, so renders need no network.
- **Fast stills while posing:** start the launch config "mascot" (`node mascot/tools/serve.cjs 5178`), open
  `http://localhost:5178/kip-ep01/tools/lab.html?name=x&w=960&cols=3` (add `&t=0.9,2.6` for chosen times; default is
  every shot's key time). The sheet lands in `boards/lab/x.png`. Without the Animations/ folder around the project
  (a cloud checkout): `node tools/serve.cjs 5178`, then `http://localhost:5178/tools/lab.html?...`.
- **Board:** `npx hyperframes snapshot --at <key times> --no-end --describe false -o boards/stills`, page
  `boards/storyboard.html`, plan `STORYBOARD.md`. `boards/.film.html` is the scaffold the project started from;
  `boards/.posed.html` is the posed composition.
