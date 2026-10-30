# Night notes: finishing the picture (cloud session, night of 2026-10-30)

Branch `claude/trusting-davinci-g7gedy`, pushed after every scene. Nothing is merged into `main`. No music, effects,
mix or render was made, nothing was downloaded, `assets/vo/` is untouched and `scripts/sync-kit.cjs` was not run.

## Done and checked

Every shot, 1–69, is animated. Each scene was checked frame by frame in the lab (half-size contact sheets every
0.35–0.5 s, plus full-size stills of anything doubtful), fixed, and re-checked before the next scene was started.

| Scene | Shots | What changed tonight |
| --- | --- | --- |
| 2 Easy | 12 | Fixed from the full-size QA stills: the two-shot cropped the top of ghost Kip's head and Mom's head covered his mouth; he waves from a little further off and the frame is taller. |
| 3 The search | 17–33 | Restaged so every shot reads: no camera inside a wall, box or head; Dad's portrait shows his face; the marker, the mustache, the hoist and carry, the garage box, the attic and the tap all read. |
| 4 Looking for something? | 34–43 | New (`scene4.js`). |
| 5 Where's my body? | 44–55 | New (`scene5.js`). |
| 6 0:01 | 56–61 | New (`scene6.js`). |
| 7 Happy birthday | 62–67 | New (`scene7.js`), morning light. |
| 8 The cat | 68–69 | New (`scene8.js`), with the 15 s end screen. |

Shared pieces added to `assets/film/stage.js`: `momFrozen` (Mom's real body after shot 33), `legIK`, `stairGait`,
`cruise`, and `kipInBed` / `tuckIn` (Kip or his body in his bed, lying back or sitting up, with the blanket drawn over
him). `world.js` resets everything a shot may move (the marker cap, the garage present, the blanket, Kip's door, his
present under the bed).

Continuity checked across the film:

- The mustache is on Kip's body (and on Kip once he is back in it) in every shot after 24, from the same face
  parameter, so the same shape.
- Mom's real body stays frozen mid-sip at the kitchen counter in every shot after the tap (33): no breath, no blink.
- The same cat throughout; in 68 her ghost rises out of her and her body freezes on the sill.
- Scene 7 is morning (`w.mood('morning')`, the sun through Kip's window, the lamp off).
- The timer only goes down: 3:41, 2:10, 1:30 (turns red), 0:58, 0:31, 0:15, 0:05, 0:03, 0:02, 0:01 (the HUD overlay);
  5:00 → 4:58 is on the TV in shot 4.

**Overlays.** `scripts/overlays.py` reads `assets/film/timeline.js` and writes three sub-compositions mounted over the
canvas from `index.html` (hosts between the `overlays:begin/end` markers): `compositions/captions.html` (56 caption
groups for the 54 lines), `compositions/hud.html` (the 11 timer readings), `compositions/cards.html` (the title over the
dollhouse in shot 16, "Next: Kip vs. ___" on the end screen). All Itim via `@font-face`. Rerun it after any retime:

```bash
python scripts/timeline.py && python scripts/overlays.py
```

Three departures from SPEC § LOOK, all for the text rules in HANDOFF.md (never over a face, contrast at least 3:1):

- **Captions sit on a dark scrim sized to each line** (55% near-black, rounded), on top of the spec's white text and
  shadow: plain white text fell under 3:1 over the pale ghosts and the morning walls.
- **Captions that would cover a face go to the top of the frame** (top of the title-safe box). `tools/faces.cjs`
  (with `node tools/serve.cjs 5178` running) poses the film every 0.2 s while each line can be on screen, projects
  every face turned to the camera (brows to chin), and writes `assets/film/caption-faces.json`; `overlays.py` reads
  it. 19 of the 54 lines go to the top. Rerun it after restaging a shot.
- The title card keeps the spec's look with a soft dark halo behind the letters, so "KIP" in yellow reads over the
  dollhouse's pale attic.

**Whole-film QA.** Besides the per-scene lab passes, `npx --yes hyperframes@0.8.221 snapshot` stills at full size
through the real composition (overlays included): every shot at its middle, every HUD reading, the title, the end card
and every caption that moved (`boards/cloud/`, `boards/cloud2/`, not in git). What they caught is fixed: shot 12,
captions over chins in the close shots, captions low in contrast.

**Sound cues.** `assets/film/cues.js` exports `CUES` (64 cues: `{ t, what, shot }`), each a moment in a shot taken
from that shot's motion constants and placed by `TIMELINE`, so they follow a retime.

**GSAP is vendored.** `index.html` loads GSAP 3.14.2 from `assets/vendor/gsap/gsap.min.js` (the same file the CDN
served, from the npm registry), like three.js: the cloud's network blocks cdn.jsdelivr.net, so `check` failed every
composition script on `gsap.timeline`. The 3D canvas carries `data-layout-ignore` (it fills the frame by design).

`npx --yes hyperframes@0.8.221 lint --json`: 0 errors, 0 warnings. (`check` results below.)

## Changes to `assets/kit/` (copy these back to `Animations/mascot/` before the next sync)

All in `assets/kit/house.js`; `scripts/sync-kit.cjs` will overwrite them unless the source kit gets them too:

1. `RIDGE = ATTIC + 2.6` (was `ATTIC + 1.9`): the attic roof is taller, so the ghosts can float upright along the middle
   of the attic (scenes 3–4 happen there).
2. The garage bulb `PointLight('#FFD9AE', 2.2, …)` (was 1.5): the garage read too dark.
3. The attic fill `PointLight('#E9C9A0', 1.3, …)` at `(-1.2, ATTIC + 1.4, 0.0)` (was 0.9 at `(0, ATTIC + 1.2, 0.6)`):
   faces in the attic were too dark, and the old spot blew one side of a face out.

## Timing changes

- Shot 25 "Hup": planned 6.0 → 8.5 s in `scripts/timeline.py` (the squat hoist, the carry across the room and the
  climb, tread by tread, could not play in 6 s). Everything after it moves 2.47 s later; the film is now 265.20 s
  (7956 frames), was 262.73 s. The root and canvas `data-duration` in `index.html` were raised to match.
  SPEC.md's absolute times are older than `timeline.py` anyway; the shot order and lines are unchanged.

## Decisions made without asking (please review)

- **Shot 23–24, the marker:** drawn at 1.6× its kit size so it reads in the round nub hands. Shot 24 is an upright
  two-shot with Mom's arm reaching in (her head covered his face in the over-the-shoulder version).
- **Shot 29, inside the box:** the garage present is scaled (1.2, 1.6, 1.6) and its ribbon hidden for this shot only,
  so the camera fits inside it; a slit of light at the lid's back edge and the tag.
- **Shot 33, the tap:** ghost Mom floats kneeling at his shoulder and taps his shoulder blade twice while his head is
  in the trunk.
- **Scene 4:** Kip pulls himself out of the trunk; Mom lounges in the air with her arms folded through the whole talk.
- **Mom's frozen body** leans back on the counter facing the room (`MOM_LEAN`), so her frozen face reads in 46–47.
- **Shot 45:** a two-shot (Mom coming down through the ceiling beside Kip), not a single on her, so the scene's
  geography stays clear.
- **Shots 53–55, the stairs:** high side views from the living room, not "from below": from below, the stair treads
  showed through the see-through ghost's face and his face went dark. 53 opens with him mid-slump.
- **Shot 56:** the cat comes up the last tread and slips between two balusters of the stairwell rail into the hall
  (the stairs arrive behind the rail). Kip's door now stands a little open *into his room* in every shot (it opened
  into the hall before); in scene 6 it is wider, for the cat.
- **Shot 58:** the dive starts from the foot of the bed and lands along his body; the ghost sinks into it and is gone
  before the cut, so the ECU of his eyes (59) follows with no black frame.
- **Scene 7:** Mom stands by the nightstand facing the room with her head turned to Kip, so both faces read in the
  two-shot (63, shot from beyond the foot of the bed) and her close shot (64, lit from below by the candle).
- **Shot 65:** the "high angle" shows him lean over the edge and slide the present out from right under where he slept,
  then sit back and stare at it (from directly above, under the bed can't be seen).
- **Shot 66:** filmed from the mirror's side (he looks into the lens) rather than over his shoulder: the mirror is
  narrow, and over the shoulder his own head filled the frame and the mirror's edge cut his reflection. The 1-second
  insert of Dad's disco photo (2.0–3.0 s into the shot) is framed to match his face.
- **Shot 68:** the ghost cat glides along the front wall and into the corner, tail last; the cat's body freezes on the
  sill once her ghost is out (like everyone else's body).
- **The end screen (69):** Kip in the left 40%, staring at the corner the ghost cat went into; a slow push; "Next:
  Kip vs. ___" at the bottom left.

## Unverified

- No final render was made (not tonight's job), so nothing has been checked as video: no blackdetect, no frame-rate
  check, no lip sync against the mix.
- `cues.js` is computed from the motion; nobody has heard a sound on it yet.
- Scenes 1–2 were not reworked tonight beyond shot 12; they were seen again only in the full-size QA stills (one or
  two moments a shot), not in dense passes.

## Open questions

- **Short captions in fast exchanges.** The reading-time rule (max(2.5 s, 0.3 s a word + 1 s)) can't hold for 15
  captions without two groups on screen at once (the next line starts too soon); they stay up until the next line
  instead (at least 1.1 s). Merge those exchanges into two-speaker groups, or keep one group at a time?
- **The HUD sits on y 84 as SPEC.md says**, which is inside the action-safe box but above the 80% title-safe box.
- **"Rude." (k05)** goes to the top of the frame (his face fills the bottom of shot 8); for about 0.4 s of its hold the
  top of his head comes up under it.
- **"Next: Kip vs. ___"** is a placeholder: what is episode 2?
