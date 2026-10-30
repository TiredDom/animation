# SPEC: Kip vs. Spectator Mode (episode 1)

Story: STORYLINES.md § D, locked by the user on 2026-10-30. This is the director's brief: build from it, check
against it, and update it when a review changes the film. Shot times are the plan; they are re-timed to the
recorded voice lines, never squeezed to fit a number.

```text
GOAL:    The viewer laughs when Kip wakes up on his birthday with a mustache, on top of the present he hunted
         all night, and wants episode 2 when the cat floats out of its body. The comment it fishes for:
         "this explains my mom".
OUTPUT:  HyperFrames, 1920 × 1080, 30 fps, landscape (long-form YouTube).
TIME:    about 248 s planned × 30 = about 7,440 frames (the voice sets the final length); score at 100 BPM =
         18 frames a beat, 72 frames a bar.
```

## LOOK

- **Medium:** a 3D toy-house world in Kip's studio look (`mascot/studio.js`): matte, soft, physically lit, with
  ambient occlusion and no outlines anywhere.
- **Ground:** the house itself, never a void. Plaster walls at roughness 0.9, wood floors at roughness 0.6 with
  18 cm planks, 3–5 props per room, every edge rounded by 1.5 cm.
- **Room colours (sRGB):** living room #D9C6B0, kitchen #CFDCD4, upstairs hall #D6CFC6, Mom's closet #D8CCDD,
  garage #B9B6AE (concrete), attic #B89A78 (wood), Kip's room #C9D7E6; floors #A97C55.
- **Night light:** a warm lamp key #FFC58A (a point light in the shade, 2.4), cool moonlight #A9C1F0 at 1.0 through the
  window, the TV's cool spot #A8C4FF on the couch as the front fill, a hemisphere #2E3B5C / #3B2E25 at 0.35, room
  environment at 0.15. Neutral tone mapping at exposure 1.0, GTAO blend 0.85 at
  radius 0.25, contact shadows under everyone standing.
- **Morning light (scene 7):** sun #FFE8C2 at 2.6 through the window, environment 0.6.
- **Ghosts (Kip, Mom, the cat):** the same rig rendered as one layer, then composited at 55% opacity, so no part
  shows through another; tinted 72% toward #A8CFFF and up to 1.8× brighter at grazing angles (raised from 45% / 1.4×
  on the board, where the warm lamp turned them peach); a 2.4 s hover of ±2 cm. No bloom: they are see-through, not
  glowing.
- **Accent:** Kip's hoodie yellow #FFB833 is the only saturated colour in most frames. On text it appears only in
  the title card and the end card.
- **Type:** Itim only (the channel rule; every text passes `node rigs/tools/text_qa.js`).
  - Captions: 58 px white, shadow 0 3 px 0 at 45% black, centred on y 930, at most 32 characters a line, one
    caption group at a time, on screen for every spoken line.
  - The one HUD: "SPECTATING · RETURN IN 4:59", 34 px white at 90%, top centre on y 84. The numbers turn #FF5A4E
    from 1:30 down.
  - Title card: "KIP vs. SPECTATOR MODE", 120 px, "KIP" in #FFB833, the rest white.
- **Lenses (vertical FOV):** wide 38°, medium 27°, close-up 16°. The camera sits at Kip's chest height (1.0 m)
  unless a shot says otherwise.

## OBJECTS

- **Kip:** the locked rig (`mascot/mascot.js`), Sunny colorway. New face dial: a curly mustache painted on the head
  (#1F1512, 0.34 R wide), drawn on stroke by stroke in shot 24 and kept in every later shot of his body.
- **Mom (new; needs a character-sheet OK):** Kip's build at about 1.08× his height, the same painted dot face plus
  painted lashes, dark-brown hair in a round bun with a side-swept fringe, a teal cardigan #2FA39A over a cream
  top #F1E9DC, charcoal trousers #3A3D46, grey slippers. Holds a phone, a mug, a marker.
- **The cat (new; needs a sheet OK):** a plump, round grey #8E959E cat with a white muzzle and paws, rounded ears
  and a tapered tail; painted dot eyes whose pupils go 1.6× wide when she sees a ghost. Poses: sit, walk, hiss
  (arched back, tail up), lead (trot, look back).
- **TV and game:** a flat TV on a low stand; the screen is a canvas texture: a chunky pixel hero, "YOU DIED" in red
  #E8453C, then "SPECTATE? Y / N" in white, then "SPECTATING" with the countdown.
- **Controller:** a rounded dark-grey gamepad, gripped by the nub hands (the grip drawn over it).
- **Living room:** a sage #8FA38A couch with three cushions, a floor lamp with a warm shade, an armchair for the cat.
- **Kitchen:** the fridge with a paper calendar, tomorrow circled in red with "KIP'S BIRTHDAY!" (40 px); Mom's
  rounded dark phone; a mug of tea with two thin steam wisps on a seeded 1.6 s loop.
- **Mom's closet:** hanging clothes in four muted colours, two shoeboxes, and the framed photo of Dad in Kip's
  style: huge afro, curly mustache, disco shirt (a painted 3:4 canvas in a gold frame).
- **Marker:** black, white cap; its stroke paints the mustache over 1.2 s.
- **Garage:** a shelf with a wrapped box (blue #3E6FD8 paper, red #E8453C ribbon); inside, rolled socks and a tag
  "To Dad, from Grandma" (30 px).
- **Attic:** sloped beams, a round moonlit window, an old trunk with brass corners; inside, Kip's baby photos.
- **The three fakes:** a laundry pile shaped like a body (hall), Dad's coat and hat slumped on a kitchen chair, a
  heap of couch cushions.
- **Kip's room:** a bed with a blue blanket #4C6EA8, the present under it (yellow #FFB833 paper, white ribbon, tag
  "KIP"), a wall mirror; in the morning, a cupcake with one candle.

## MOTION

- **Natural, never bouncy** (the user's rule): enter = sine.out over 12–18 f, move = sine.inOut, exit = sine.in over
  10–14 f, camera = cubic.inOut over 24–60 f. No overshoot and no springs, except one comic stretch on the pop-out
  (1.12× tall over 6 f, settling over 10 f).
- **Acting:** every mood change is anticipation (4–6 f), then the new face, then a settle (8 f). Parts are offset
  2–4 f (the head leads, the arms follow); never both arms or both eyes in unison. Faces blend over 8–12 f;
  blinks and breathing come from `kip.update(t)`.
- **Spectator camera:** glides on cubic.inOut with a 0.5° roll drift. A wall pass is a 12-frame push through a
  10 cm wall slab that wipes across the frame.
- **Normal-world camera:** locked off, or a slow push of at most 8% across a shot.
- **Lip-sync:** mouthOpen / mouthRound driven by each voice file's loudness, leading by 2 frames.

## VOICES

- **Kip:** a young teen boy, quick, bright, a little cocky; his jokes land flat and fast ("Socks."). Catchphrase
  "Easy.", said once, with total confidence.
- **Mom:** warm, dry, unhurried, always one step ahead; she never raises her voice.
- Both on ElevenLabs (the Creator plan), the same voices in every episode. Line IDs below (k = Kip, m = Mom) name
  the voice files. The cat is SFX from the bank (hiss, meow).

## SHOTS

Each line: number · time (frames) · framing · the hero move · what the viewer reads or hears · the hand-off.

### Scene 1: Spectate (living room, night, 0–26.5 s)
1. 0.0–1.2 s (f0–36) · CU the TV in the lamp-lit room · "YOU DIED" slams in, "SPECTATE? Y / N" at f18 · game death
   sting, button click at f30 · cut on the click.
2. 1.2–4.5 s (f36–135) · WIDE front: Kip on the couch, the cat on the armchair, the lamp · ghost Kip lifts out of his
   frozen body (f42–75, the comic stretch) and rises 0.5 m · a soft "fwoomp" and shimmer, a held string chord ·
   ends on him looking at his hands. (The thumbnail moment.)
3. 4.5–7.5 s (f135–225) · MCU ghost Kip, see-through hands up · he turns them over, looks down at himself ·
   **k01 "...Uh. Hello?"** · ends on the look down.
4. 7.5–10.0 s (f225–300) · TV insert · the screen flips to "SPECTATING · RETURN IN 5:00" and ticks to 4:58 · a game
   beep · cut back.
5. 10.0–13.5 s (f300–405) · MS Kip by the lamp · his hand passes through the shade · **k02 "Okay. Okay, okay,
   okay."** · he turns to his body.
6. 13.5–17.0 s (f405–510) · CU his frozen body's face, a ghost finger entering · the finger sinks into his own cheek
   · **k03 "Ew."** · a hiss off screen.
7. 17.0–21.5 s (f510–645) · MS the cat on the armchair · her head tracks him, pupils widen, back arches, hiss ·
   **k04 "You can see me?"** · cut on the hiss.
8. 21.5–24.0 s (f645–720) · MCU Kip, offended · **k05 "Rude."**, then a 12-frame hold · he turns to the wall.
9. 24.0–26.5 s (f720–795) · MS profile: Kip leans headfirst into the kitchen wall · the wall slab wipes across as the
   camera pushes through with him · whoosh · into the kitchen.

### Scene 2: Easy (kitchen, 26.5–51 s)
10. 26.5–30.0 s (f795–900) · MS: Kip's head pokes out of the wall beside the fridge · the calendar reads "KIP'S
    BIRTHDAY!" (held 2.4 s); Mom at the counter on the phone, her back to us · cut on her voice.
11. 30.0–34.0 s (f900–1020) · MS Mom on the phone, mug in hand · **m01 "No, he won't find it. I hid it where he'll
    never look."** · Kip floats fully in behind her.
12. 34.0–37.0 s (f1020–1110) · two-shot: Kip waves in her face; she sips her tea · **k06 "Mom? MOM."** · no reaction.
13. 37.0–41.0 s (f1110–1230) · MCU Mom · **m02 "And he still thinks I don't know about the chips under the couch."**
14. 41.0–43.5 s (f1230–1305) · CU Kip, outraged · **k07 "How does she know about the chips?!"**
15. 43.5–48.0 s (f1305–1440) · MCU: Kip turns to camera, a grin spreads (determined face) · **k08 "Hidden present.
    Invisible me." (beat) "...Easy."** · the theme starts on "Easy." (downbeat at f1404).
16. 48.0–51.0 s (f1440–1530) · TITLE over a top-down spectator view of the whole house cut open like a dollhouse ·
    "KIP vs. SPECTATOR MODE" · the theme · ends as ghost Kip shoots up through the kitchen ceiling.

### Scene 3: The search (51–107 s)
17. 51.0–54.0 s (f1530–1620) · the camera follows him up through the floor slab into the upstairs hall · whoosh.
18. 54.0–58.0 s (f1620–1740) · MS Mom's closet: Kip's head pushes through the closed door · he scans clothes and
    shoeboxes · **k09 "Shoes... shoes... shoes..."** · his eyes land on the photo.
19. 58.0–62.5 s (f1740–1875) · CU the framed photo: Dad with an afro, a curly mustache, a disco shirt · **k10
    "Dad?"**, then a beat.
20. 62.5–65.5 s (f1875–1965) · CU Kip, haunted · **k11 "I can never unsee that."**
21. 65.5–67.5 s (f1965–2025) · HUD over his view: "RETURN IN 3:41" · a tick · cut away.
22. 67.5–71.0 s (f2025–2130) · WIDE living room: Mom walks in and finds Kip's frozen body on the couch · she stops;
    a slow, knowing smile (8-frame anticipation) · the music drops to one plucked note.
23. 71.0–73.5 s (f2130–2205) · CU Mom's hand uncaps a marker · cap pop.
24. 73.5–77.0 s (f2205–2310) · CU the body's face: the marker draws a curly mustache, stroke by stroke over 1.2 s ·
    three marker squeaks.
25. 77.0–81.0 s (f2310–2430) · WIDE: Mom hoists the body over her shoulder like a sack and climbs the stairs ·
    **m03 effort "Hup."** and footsteps · out of frame.
26. 81.0–84.0 s (f2430–2520) · MS the garage from below: Kip drops through the ceiling beside the shelf · whoosh.
27. 84.0–87.0 s (f2520–2610) · MCU the wrapped box, blue paper, red bow · **k12 "Bingo."**
28. 87.0–90.5 s (f2610–2715) · CU his hands pass straight through the box · **k13 "Oh, come ON."**
29. 90.5–94.5 s (f2715–2835) · INSIDE the box: one sliver of light on Kip's see-through face, rolled socks, the tag
    "To Dad, from Grandma" (read 2.4 s) · **k14, flat: "Socks."**
30. 94.5–96.5 s (f2835–2895) · HUD: "RETURN IN 2:10" · a tick.
31. 96.5–100.0 s (f2895–3000) · WIDE attic: Kip rises through the floorboards into moonlight; the trunk · **k15,
    whispered: "Nobody ever checks the attic."** · a creak.
32. 100.0–104.0 s (f3000–3120) · MS: his head inside the trunk, the rest of his ghost body sticking out ·
    **k16, muffled: "Baby pictures... no..."**
33. 104.0–107.0 s (f3120–3210) · CU his back: a see-through hand taps his shoulder · the music stops dead ·
    **k17, slow, from inside the trunk: "...Spectators can't be touched."**

### Scene 4: Looking for something? (107–138.5 s)
34. 107.0–110.0 s (f3210–3300) · MS: Kip pulls his head out and turns · a see-through Mom floats beside him, arms
    crossed, one brow up · **m04 "Looking for something?"** · a sting.
35. 110.0–112.0 s (f3300–3360) · CU Kip screams, eyes and mouth wide · **k18 (scream)**.
36. 112.0–115.0 s (f3360–3450) · two-shot · **k19 "MOM?! You... you have..."**
37. 115.0–119.0 s (f3450–3570) · MCU Mom, calm · **m05 "Spectator mode? Sweetie. I've had it since I was your
    age."**
38. 119.0–122.0 s (f3570–3660) · MCU: Mom leans in · **m06 "How do you think I know about the chips?"**
39. 122.0–126.0 s (f3660–3780) · CU Kip: shock into realization (a 12-frame face blend) · **k20 "Every time I got
    caught... that was YOU?"**
40. 126.0–128.0 s (f3780–3840) · MS: Mom shrugs, smug · a beat.
41. 128.0–134.0 s (f3840–4020) · MCU Mom, closer, low · **m07 "One more thing. If your timer hits zero before you're
    back in your body..." (beat) "...you stay like this. Forever."** · the ticking starts.
42. 134.0–136.0 s (f4020–4080) · HUD: "RETURN IN 1:30" turns red · the tick gets louder.
43. 136.0–138.5 s (f4080–4155) · MS · **k21 "Okay, bye!"**, and he dives straight down through the floor · whoosh.

### Scene 5: Where's my body? (138.5–181 s)
44. 138.5–143.0 s (f4155–4290) · WIDE from the ceiling corner: Kip drops in by the couch: empty, the controller in
    the dent · **k22 "No. No no no. Where am I?!"**
45. 143.0–146.0 s (f4290–4380) · MS: ghost Mom drifts down through the ceiling, relaxed · **m08 "Warmer..."**
46. 146.0–150.0 s (f4380–4500) · MS kitchen: Kip zips past Mom's real body, frozen mid-sip of tea, and recoils ·
    **k23 "Gah! Your body is so creepy."** · **m09, off: "Colder."**
47. 150.0–151.5 s (f4500–4545) · HUD 0:58 · a tick.
48. 151.5–155.0 s (f4545–4650) · MS hall: a laundry pile shaped like a body; Kip dives through it and comes up
    empty · **k24 "Laundry!"**
49. 155.0–158.0 s (f4650–4740) · MS: Dad's coat and hat slumped on a kitchen chair; he lunges through it · **k25
    "Coat!"**
50. 158.0–161.0 s (f4740–4830) · MS: a heap of couch cushions; he dives in · **k26 "Cushions!"** · HUD 0:31.
51. 161.0–165.5 s (f4830–4965) · two-shot, Mom floating, gentle · **m10 "You know, you could just ask."** ·
    **k27 "Then you'd win!"** · **m11 "Mm-hm."**
52. 165.5–167.0 s (f4965–5010) · HUD 0:15 · the tick slows.
53. 167.0–173.0 s (f5010–5190) · WIDE, the stairs from below: Kip slumps on a step, head in his hands · **k28, quiet:
    "I just wanted to see my present."** · solo clarinet, slow.
54. 173.0–177.0 s (f5190–5310) · MS: the cat walks up and sits on the step beside him, staring · **k29 "...What?"** ·
    a meow.
55. 177.0–181.0 s (f5310–5430) · MS: the cat trots upstairs, stops, looks back · **k30 "You know where I am?"**

### Scene 6: 0:01 (181–199 s)
56. 181.0–184.0 s (f5430–5520) · tracking down the hall: the cat leads, Kip floats after; his bedroom door · the music
    builds · through the door (wall pass).
57. 184.0–187.0 s (f5520–5610) · WIDE Kip's room: his body tucked into bed, mustache on · HUD 0:05 · **k31 "THERE I
    AM!"**
58. 187.0–190.0 s (f5610–5700) · half-speed side view: ghost Kip dives at the bed; HUD 0:03, 0:02, 0:01 · the swell.
59. 190.0–191.0 s (f5700–5730) · ECU: his body's eyes snap open · a "whoomp" and the music hit · no black frame.
60. 191.0–195.0 s (f5730–5850) · MS: Kip sits bolt upright, panting · **k32, gasping: "I'm back! I'm..."**
61. 195.0–199.0 s (f5850–5970) · CU: he touches his upper lip · **k33 "...Why is my lip sticky?"** · a time cut to
    morning.

### Scene 7: Happy birthday (199–223 s)
62. 199.0–203.0 s (f5970–6090) · WIDE Kip's room in morning sun: Mom opens the door with a one-candle cupcake ·
    **m12 "Happy birthday, sweetie."** · she clocks the mustache and keeps a straight face · a warm glockenspiel
    theme.
63. 203.0–207.0 s (f6090–6210) · two-shot · **k34 "Mom. About last night..."** · **m13 "No idea what you mean."**
64. 207.0–210.5 s (f6210–6315) · MCU Mom · **m14 "Your present's been under your bed the whole time."**
65. 210.5–214.0 s (f6315–6420) · high angle: Kip leans over the edge; the yellow present sits right under where he
    slept · **k35 "...I slept on it."** · **m15, off: "All night."**
66. 214.0–219.0 s (f6420–6570) · MS: Kip catches himself in the mirror, curly mustache; a 1-second match to Dad's
    disco photo · **k36 "...I look like Dad."**
67. 219.0–223.0 s (f6570–6690) · WIDE · **k37 "MOM!"** · Mom, already out the door: **m16, off: "Happy
    birthday!"** · the music's button.

### Scene 8: The cat (end gag and end screen, 223–248 s)
68. 223.0–233.0 s (f6690–6990) · WIDE: Kip on the bed with his present, the cat on the windowsill; they stare at each
    other for 3 s; a see-through cat slowly rises out of the cat, looks at Kip and glides through the wall ·
    **k38 "...EVERYONE has it?!"** · a pizzicato button.
69. 233.0–248.0 s (f6990–7440) · END SCREEN: the room holds on Kip staring at the wall, the right 60% kept clear for
    YouTube's two video tiles and the subscribe button; "Next: Kip vs. ___" in Itim · the end theme.

## SOUND

- **Score** (`music/orchestra.py`, one hall, tails ring, never a dead cut): a sneaky pizzicato-and-clarinet theme at
  100 BPM that starts on "Easy." (shot 15); the search plays its variations; it stops dead on the tap (shot 33);
  the race doubles the feel over the same tempo; the low point is a solo clarinet; the dive is a swell into one
  hit; the morning is warm glockenspiel; the cat gets a pizzicato button.
- **SFX** (`sfx/bank.py`, real recordings; only the pops and the game sounds synthesized): game death sting and
  beep, button click, the pop-out "fwoomp", wall-pass whooshes, cat hiss and meow, marker cap and squeaks,
  footsteps on stairs, box rustle, trunk creak, the timer tick (louder and faster from 1:30, slower at 0:15), the
  wake-up "whoomp", the candle.
- **No ambience beds** (channel rule): the music leads. In spectator mode Kip makes no footsteps; he floats.
- **Sync** (the house rule): every sound lands on its picture frame (contact, the peak of a whoosh); mouths follow
  the voice files.

## BANNED

- Everything on the default list: a dark void with small things floating in it; glow, bloom, neon, flares, orbs,
  particles as decoration; purple or blue gradients and glass cards; the cream-paper serif look with small mono
  labels and pill chips; everything centred or fading in together; text that moves while it is read; corner labels,
  frame borders and HUD readouts as decoration (the one story timer is the only HUD); three cards in a row; a
  docked logo.
- For this film: ghosts that glow instead of being see-through; any part of a ghost showing through another; ink
  outlines; bouncy eases or overshoot (except the one pop-out stretch); both arms or both eyes moving in unison;
  black frames or cuts to black (the dive cuts to his eyes); a caption that repeats what the picture already shows;
  any sound without its picture; a "What IF You Had Spectator Mode" title.

## QA

- f0: the TV's "YOU DIED" reads in a lit room, never black.
- f60 (2 s): two Kips read at a glance: the ghost is clearly see-through, the body clearly frozen.
- Shot 10: "KIP'S BIRTHDAY!" is readable for 2.4 s.
- Shot 15: "Easy." lands on the theme's downbeat (f1404).
- The mustache: absent before shot 24, present on his body in every shot after it, the same shape each time.
- Mom's real body stays frozen mid-sip in the kitchen in every shot after she turns ghost.
- The timer only ever goes down: 5:00, 4:58, 3:41, 2:10, 1:30 (red), 0:58, 0:31, 0:15, 0:05, 0:03, 0:02, 0:01.
- Every frame: contact (bodies stand on the floor, ghosts hover at least 10 cm), facing logic, grips drawn over the
  controller, mug, phone and marker, no face hidden.
- No black frames anywhere (blackdetect on the render); every text passes `rigs/tools/text_qa.js`;
  `npx hyperframes check --json` clean; a snapshot review of each scene before the next one is built.
