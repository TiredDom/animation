"""The film's clock: every shot of SPEC.md timed around its recorded voice lines.

Each shot has a planned length, the lines it carries (when each starts, in seconds into the shot, or 'after' the
previous line with a gap) and a tail held after its last line. A shot lasts its planned length or until its last line
ends plus the tail, whichever is longer, so a line never gets squeezed. Writes assets/film/timeline.js (the picture,
the captions and the mix all read it) and prints the timing report.

    python scripts/timeline.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINES = {x['id']: x for x in json.loads((ROOT / 'assets/vo/lines.json').read_text(encoding='utf-8'))}
FPS = 30

# (shot, scene, title, planned seconds, lines, tail after the last line)
# a line is (id, at) with at in seconds from the shot start, or (id, 'after', gap) after the previous line ends
SHOTS = [
    # Scene 1: Spectate
    (1, 1, 'YOU DIED', 1.2, [], 0),
    (2, 1, 'Two Kips', 3.3, [], 0),
    (3, 1, 'Hello?', 3.0, [('k01', 1.0)], 0.4),
    (4, 1, 'Return in 5:00', 2.5, [], 0),
    (5, 1, 'Okay, okay', 3.5, [('k02', 0.9)], 0.3),
    (6, 1, 'Ew', 3.5, [('k03', 2.4)], 0.2),
    (7, 1, 'She can see him', 4.5, [('k04', 3.0)], 0.3),
    (8, 1, 'Rude', 2.5, [('k05', 0.3)], 1.1),
    (9, 1, 'Into the wall', 2.5, [], 0),
    # Scene 2: Easy
    (10, 2, 'The calendar', 3.5, [], 0),
    (11, 2, 'Mom on the phone', 4.0, [('m01', -0.4)], 0.5),
    (12, 2, 'Mom? MOM.', 3.0, [('k06', 0.6)], 0.7),
    (13, 2, 'The chips', 4.0, [('m02', 0.3)], 0.35),
    (14, 2, 'How does she know?', 2.5, [('k07', 0.2)], 0.45),
    (15, 2, 'Easy.', 4.5, [('k08', 0.5)], 0.55),
    (16, 2, 'Title', 3.0, [], 0),
    # Scene 3: The search
    (17, 3, 'Up through the floor', 3.0, [], 0),
    (18, 3, "Mom's closet", 4.0, [('k09', 0.5)], 0.3),
    (19, 3, 'The photo', 4.0, [('k10', 1.4)], 1.9),
    (20, 3, 'Unsee', 3.0, [('k11', 0.4)], 0.6),
    (21, 3, 'HUD 3:41', 2.0, [], 0),
    (22, 3, 'Mom finds the body', 3.5, [], 0),
    (23, 3, 'The marker', 2.5, [], 0),
    (24, 3, 'The mustache', 3.5, [], 0),
    (25, 3, 'Hup', 6.0, [('m03', 1.0)], 4.4),
    (26, 3, 'The garage', 3.0, [], 0),
    (27, 3, 'Bingo', 3.0, [('k12', 1.2)], 0.8),
    (28, 3, 'Come on', 3.5, [('k13', 1.4)], 0.5),
    (29, 3, 'Socks', 4.0, [('k14', 2.6)], 0.5),
    (30, 3, 'HUD 2:10', 2.0, [], 0),
    (31, 3, 'The attic', 3.5, [('k15', 1.2)], 0.3),
    (32, 3, 'The trunk', 4.0, [('k16', 0.8)], 0.5),
    (33, 3, 'The tap', 3.0, [('k17', 0.9)], 0.35),
    # Scene 4: Looking for something?
    (34, 4, 'Looking for something?', 3.0, [('m04', 1.4)], 0.4),
    (35, 4, 'Scream', 2.0, [('k18', 0.1)], 0.5),
    (36, 4, 'You have...', 3.0, [('k19', 0.2)], 0.3),
    (37, 4, 'Since I was your age', 4.0, [('m05', 0.3)], 0.4),
    (38, 4, 'The chips', 3.0, [('m06', 0.5)], 0.4),
    (39, 4, 'That was YOU?', 4.0, [('k20', 0.6)], 0.4),
    (40, 4, 'Shrug', 2.0, [], 0),
    (41, 4, 'Forever', 6.0, [('m07', 0.3)], 0.45),
    (42, 4, 'HUD 1:30', 2.0, [], 0),
    (43, 4, 'Okay, bye!', 2.5, [('k21', 0.2)], 0.85),
    # Scene 5: Where's my body?
    (44, 5, 'Where am I?', 4.5, [('k22', 1.0)], 0.3),
    (45, 5, 'Warmer', 3.0, [('m08', 1.6)], 0.45),
    (46, 5, 'So creepy', 5.0, [('k23', 0.9), ('m09', 'after', 0.15)], 0.35),
    (47, 5, 'HUD 0:58', 1.5, [], 0),
    (48, 5, 'Laundry!', 3.5, [('k24', 2.0)], 0.6),
    (49, 5, 'Coat!', 3.0, [('k25', 1.8)], 0.45),
    (50, 5, 'Cushions!', 3.0, [('k26', 1.8)], 0.9),
    (51, 5, 'You could just ask', 4.5, [('m10', 0.4), ('k27', 'after', 0.15), ('m11', 'after', 0.25)], 0.45),
    (52, 5, 'HUD 0:15', 1.5, [], 0),
    (53, 5, 'My present', 6.0, [('k28', 2.2)], 1.8),
    (54, 5, 'What?', 4.0, [('k29', 2.6)], 0.7),
    (55, 5, 'You know where I am?', 4.0, [('k30', 2.4)], 0.25),
    # Scene 6: 0:01
    (56, 6, 'Follow the cat', 3.0, [], 0),
    (57, 6, 'There I am!', 3.0, [('k31', 1.2)], 0.6),
    (58, 6, 'The dive', 3.0, [], 0),
    (59, 6, 'Eyes open', 1.0, [], 0),
    (60, 6, "I'm back", 4.0, [('k32', 0.4)], 0.6),
    (61, 6, 'Sticky', 4.0, [('k33', 1.6)], 0.6),
    # Scene 7: Happy birthday
    (62, 7, 'Happy birthday', 4.0, [('m12', 1.6)], 0.6),
    (63, 7, 'About last night', 4.0, [('k34', 0.3), ('m13', 'after', 0.2)], 0.4),
    (64, 7, 'Under your bed', 3.5, [('m14', 0.3)], 0.45),
    (65, 7, 'I slept on it', 3.5, [('k35', 1.6), ('m15', 'after', 0.2)], 0.4),
    (66, 7, 'I look like Dad', 5.0, [('k36', 3.2)], 0.55),
    (67, 7, 'MOM!', 4.0, [('k37', 0.4), ('m16', 'after', 0.25)], 0.8),
    # Scene 8: The cat
    (68, 8, 'Everyone has it', 10.0, [('k38', 7.8)], 0.7),
    (69, 8, 'End screen', 15.0, [], 0),
]

SCENES = {1: 'Spectate', 2: 'Easy', 3: 'The search', 4: 'Looking for something?', 5: "Where's my body?",
          6: '0:01', 7: 'Happy birthday', 8: 'The cat'}


def snap(t):
    """Round to the frame grid."""
    return round(t * FPS) / FPS


def build():
    shots, lines, t = [], [], 0.0
    for n, scene, title, planned, cues, tail in SHOTS:
        start, end_line, placed = t, None, []
        for cue in cues:
            lid = cue[0]
            if cue[1] == 'after':
                at = end_line + cue[2]
            else:
                at = start + cue[1]
            at = snap(at)
            dur = LINES[lid]['duration']
            placed.append({'id': lid, 'who': LINES[lid]['who'], 'text': LINES[lid]['text'], 'start': at,
                           'end': round(at + dur, 3), 'shot': n})
            end_line = at + dur
        length = planned if end_line is None else max(planned, end_line - start + tail)
        end = snap(start + length)
        shots.append({'n': n, 'scene': scene, 'title': title, 'start': round(start, 4), 'end': round(end, 4)})
        lines += placed
        t = end
    return {'fps': FPS, 'duration': round(t, 4), 'scenes': SCENES, 'shots': shots, 'lines': lines}


def main():
    tl = build()
    out = ROOT / 'assets/film/timeline.js'
    out.write_text('// Generated by scripts/timeline.py from SPEC.md\'s shots and the recorded lines. Do not edit by hand.\n'
                   'export const TIMELINE = ' + json.dumps(tl, indent=1, ensure_ascii=False) + ';\n', encoding='utf-8')
    by = {s['n']: s for s in tl['shots']}
    cur = None
    for s in tl['shots']:
        if s['scene'] != cur:
            cur = s['scene']
            print(f"\nScene {cur}: {SCENES[cur]}")
        ls = [l for l in tl['lines'] if l['shot'] == s['n']]
        txt = '; '.join(f"{l['id']} {l['start']:.2f}-{l['end']:.2f}" for l in ls)
        print(f"  {s['n']:2d} {s['start']:7.2f}-{s['end']:7.2f} ({s['end'] - s['start']:4.2f}s) {s['title']:24} {txt}")
    m, sec = divmod(tl['duration'], 60)
    print(f"\ntotal {tl['duration']:.2f}s = {int(m)}:{sec:05.2f}, {round(tl['duration'] * FPS)} frames; wrote {out.relative_to(ROOT)}")


if __name__ == '__main__':
    main()
