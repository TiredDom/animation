"""The film's overlays, written from the clock (assets/film/timeline.js): a caption for every spoken line, the one
HUD timer, the title card (shot 16) and the end card (shot 69), all in Itim, as SPEC.md's LOOK sets them. Each kind is
a sub-composition (compositions/captions.html, hud.html, cards.html), mounted over the 3D canvas by hosts that span
the whole film, so their clocks are film time. The three files and the hosts between the overlay markers in
index.html are generated: run this again after scripts/timeline.py.

    python scripts/overlays.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / 'index.html'
TL = json.loads(re.search(r'export const TIMELINE = (\{.*\});', (ROOT / 'assets/film/timeline.js').read_text(encoding='utf-8'), re.S).group(1))
SHOTS = {s['n']: s for s in TL['shots']}
FPS = TL['fps']
# where each line's caption goes so it never covers a face: tools/faces.cjs probes every face on screen while the line
# can be up and lifts the caption to the top of the frame when one is in the bottom band
FACES_FILE = ROOT / 'assets/film/caption-faces.json'
PLACE = {k: v['place'] for k, v in json.loads(FACES_FILE.read_text(encoding='utf-8')).items()} if FACES_FILE.exists() else {}

LINE_CHARS = 32        # at most 32 characters a caption line, at most two lines a group
YELLOW = '#FFB833'
RED = '#FF5A4E'

# The one story timer: (shot, [(seconds into the shot, value)]), the value shown until the next one or the shot's
# end. The numbers are red from 1:30 down; in shot 42 the 1:30 turns red TURN_RED seconds in (a colour change on the
# same reading, so it stays one line to read).
TURN_RED = {42: 0.6}
HUD = [
    (21, [(0, '3:41')]),
    (30, [(0, '2:10')]),
    (42, [(0, '1:30')]),
    (47, [(0, '0:58')]),
    (50, [(0, '0:31')]),
    (52, [(0, '0:15')]),
    (57, [(0, '0:05')]),
    (58, [(0, '0:03'), (1.0, '0:02'), (2.0, '0:01')]),
]


# the timer's Studio rows: at most three readings to a row
HUD_LANE = {21: 1, 30: 1, 42: 2, 47: 3, 50: 3, 52: 3, 57: 4, 58: 5}


def snap(t):
    return round(round(t * FPS) / FPS, 4)


def wrap(text):
    """Word wrap at LINE_CHARS. Two lines are balanced (no one-word orphan), preferring a break after punctuation."""
    lines, cur = [], ''
    for word in text.split():
        if cur and len(cur) + 1 + len(word) > LINE_CHARS:
            lines.append(cur)
            cur = word
        else:
            cur = (cur + ' ' + word).strip()
    if cur:
        lines.append(cur)
    if len(lines) != 2:
        return lines
    words, best = text.split(), None
    for i in range(1, len(words)):
        a, b = ' '.join(words[:i]), ' '.join(words[i:])
        if len(a) > LINE_CHARS or len(b) > LINE_CHARS:
            continue
        cost = max(len(a), len(b)) - (6 if a[-1] in '.,?!' else 0)
        if best is None or cost < best[0]:
            best = (cost, [a, b])
    return best[1] if best else lines


def groups(text):
    """A line too long for one two-line caption is split at its sentences, packed greedily into groups that wrap to
    at most two lines each."""
    if len(wrap(text)) <= 2:
        return [text]
    clauses = [c for c in re.split(r'(?<=[.?!])\s+', text) if c]
    out, cur = [], ''
    for c in clauses:
        test = (cur + ' ' + c).strip()
        if cur and len(wrap(test)) > 2:
            out.append(cur)
            cur = c
        else:
            cur = test
    out.append(cur)
    return out


def captions():
    """[(id, start, end, lines, place)]: each line's groups timed in proportion to their length, then held for
    max(2.5 s, 0.3 s a word + 1 s) from their start (HANDOFF's reading time) and at least a quarter second past the
    voice, but never into the next caption: one group at a time."""
    caps = []
    for line in TL['lines']:
        parts = groups(line['text'])
        total = sum(len(p) for p in parts)
        t = line['start']
        for i, p in enumerate(parts):
            d = (line['end'] - line['start']) * len(p) / total
            cid = 'cap-' + line['id'] + ('' if len(parts) == 1 else 'abcdefgh'[i])
            caps.append([cid, t, t + d, wrap(p), PLACE.get(line['id'], 'bottom')])
            t += d
    for i, c in enumerate(caps):
        nxt = caps[i + 1][1] if i + 1 < len(caps) else TL['duration']
        words = sum(len(l.split()) for l in c[3])
        end = max(c[2] + 0.25, c[1] + max(2.5, 0.3 * words + 1.0))
        c[2] = min(end, nxt - 1 / FPS)
        c[1], c[2] = snap(c[1]), snap(c[2])
    return caps


def clip(eid, start, end, cls, inner, lane=1):
    """A timed overlay element. `lane` is its Studio display row (the render never reads it)."""
    return f'<div id="{eid}" class="clip {cls}" data-start="{start:g}" data-duration="{round(end - start, 4):g}" data-track-index="{lane}">{inner}</div>'


FONT = """      @font-face {
        font-family: "Itim";
        src: url("assets/fonts/Itim-Regular.ttf") format("truetype");
        font-display: block;
      }
      #root {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
"""


def composition(cid, note, css, body, script=''):
    """A sub-composition file: everything inside <template>, its root styled as #root."""
    return (f'<!-- {note}\n     Generated by scripts/overlays.py from assets/film/timeline.js. Do not edit by hand. -->\n'
            f'<template>\n  <style>\n{FONT}{css}  </style>\n'
            f'  <div id="root" data-composition-id="{cid}" data-width="1920" data-height="1080">\n'
            + ''.join(f'    {b}\n' for b in body) +
            f'  </div>\n  <script>\n    (() => {{\n    const tl = gsap.timeline({{ paused: true }});\n{script}'
            f'    window.__timelines["{cid}"] = tl;\n    }})();\n  </script>\n</template>\n')


CAPTIONS_CSS = """      /* 58 px white Itim, centred on y 930 (two-line groups grow upward), one group at a time; on a dark scrim sized to
         each line, so the text keeps 3:1 contrast over the pale ghosts and the morning walls */
      .caption-group {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 115px;
        text-align: center;
        font-family: "Itim", sans-serif;
        font-size: 58px;
        line-height: 70px;
        color: #ffffff;
        text-shadow: 0 3px 0 rgba(0, 0, 0, 0.45);
      }
      /* lifted to the top of the title-safe box where a face fills the bottom of the frame */
      .caption-top {
        top: 120px;
        bottom: auto;
      }
      .caption-text {
        padding: 0 18px 4px;
        border-radius: 14px;
        background: rgba(12, 12, 16, 0.55);
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
      }
"""
HUD_CSS = """      /* the one HUD: 34 px white at 90%, top centre on y 84; the numbers turn red from 1:30 down */
      .hud {
        position: absolute;
        left: 0;
        right: 0;
        top: 63px;
        text-align: center;
        font-family: "Itim", sans-serif;
        font-size: 34px;
        line-height: 42px;
        letter-spacing: 0.04em;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
      }
      .hud-num.red {
        color: RED;
      }
""".replace('RED', RED)
CARDS_CSS = """      /* the title card: 120 px, KIP in Kip's yellow, the rest white */
      .title-card {
        position: absolute;
        left: 0;
        right: 0;
        top: 330px;
        text-align: center;
        font-family: "Itim", sans-serif;
        font-size: 120px;
        line-height: 140px;
        color: #ffffff;
        text-shadow: 0 5px 0 rgba(0, 0, 0, 0.45), 0 0 26px rgba(10, 12, 24, 0.75), 0 0 8px rgba(10, 12, 24, 0.6);
      }
      /* the end card: in the left 40% of the frame, clear of YouTube's end-screen elements on the right */
      .next-card {
        position: absolute;
        left: 200px;
        width: 560px;
        bottom: 128px;
        font-family: "Itim", sans-serif;
        font-size: 64px;
        line-height: 76px;
        color: #ffffff;
        text-shadow: 0 4px 0 rgba(0, 0, 0, 0.45);
      }
      .kip {
        color: YELLOW;
      }
""".replace('YELLOW', YELLOW)


def build():
    caps = [clip(cid, s, e, 'caption-group' + (' caption-top' if place == 'top' else ''),
                 '<span class="caption-text">' + '<br />'.join(html.escape(l, quote=False) for l in lines) + '</span>')
            for cid, s, e, lines, place in captions()]
    hud = []
    for n, keys in HUD:
        sh = SHOTS[n]
        for i, (at, val) in enumerate(keys):
            s = snap(sh['start'] + at)
            e = snap(sh['start'] + keys[i + 1][0]) if i + 1 < len(keys) else sh['end']
            num = val
            mins, secs = num.split(':')
            red = int(mins) * 60 + int(secs) < 90 and n not in TURN_RED
            inner = f'<span class="hud-text">SPECTATING · RETURN IN <span class="hud-num{" red" if red else ""}">{num}</span></span>'
            hud.append(clip(f'hud-{n}' + ('' if len(keys) == 1 else 'abc'[i]), s, e, 'hud', inner, HUD_LANE[n]))
    turns = ''.join(f'    tl.fromTo("#hud-{n} .hud-num", {{ color: "rgba(255, 255, 255, 0.9)" }}, {{ color: "{RED}", duration: 0.25, ease: "sine.inOut" }}, '
                    f'{snap(SHOTS[n]["start"] + at):g});\n' for n, at in TURN_RED.items())
    t16, t69 = SHOTS[16], SHOTS[69]
    a, b = t16['start'], t16['end']
    c, d = snap(t69['start'] + 1.0), t69['end']
    cards = [clip('title', a, b, 'title-card', '<div class="title-in"><span class="kip">KIP</span> vs. SPECTATOR MODE</div>'),
             clip('next', c, d, 'next-card', '<div class="next-in">Next: <span class="kip">Kip</span> vs. ___</div>')
             .replace('data-track-index="1">', 'data-track-index="1" data-layout-allow-caption-zone data-hold>')]
    # the end card: no caption plays then (caption zone), and the end screen's stillness is deliberate (data-hold)
    # fades on the cards' inner elements (never on the clips), no movement while they are read
    fades = (f'    tl.fromTo("#title .title-in", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.45, ease: "sine.out" }}, {a + 0.15:g});\n'
             f'    tl.to("#title .title-in", {{ opacity: 0, duration: 0.35, ease: "sine.in" }}, {round(b - 0.4, 4):g});\n'
             f'    tl.fromTo("#next .next-in", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6, ease: "sine.out" }}, {c + 0.05:g});\n')
    return {
        'captions': composition('captions', 'A caption for every spoken line, one group at a time.', CAPTIONS_CSS, caps),
        'hud': composition('hud', 'The one story timer: SPECTATING · RETURN IN m:ss.', HUD_CSS, hud, turns),
        'cards': composition('cards', 'The title card over the dollhouse (shot 16) and the end card (shot 69).', CARDS_CSS, cards, fades),
    }, len(caps), len(hud)


def hosts():
    dur = TL['duration']
    rows = [('captions', 1, 'captions'), ('hud', 2, 'graphics'), ('cards', 3, 'graphics')]
    return [f'<div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="0" '
            f'data-duration="{dur:g}" data-track-index="{tr}" data-track-kind="{kind}" data-width="1920" data-height="1080"></div>'
            for cid, tr, kind in rows]


def splice(text, begin, end, body):
    i, j = text.index(begin) + len(begin), text.index(end)
    return text[:i] + body + text[j:]


def main():
    files, ncap, nhud = build()
    (ROOT / 'compositions').mkdir(exist_ok=True)
    for name, text in files.items():
        (ROOT / 'compositions' / f'{name}.html').write_text(text, encoding='utf-8')
    page = INDEX.read_text(encoding='utf-8')
    pad = '\n      '
    page = splice(page, '<!-- overlays:begin (generated by scripts/overlays.py from assets/film/timeline.js) -->',
                  '<!-- overlays:end -->', pad + pad.join(hosts()) + '\n      ')
    INDEX.write_text(page, encoding='utf-8')
    print(f'wrote compositions/captions.html ({ncap} caption groups for {len(TL["lines"])} lines), hud.html ({nhud} readings), '
          f'cards.html (title and end cards), and their hosts in index.html')


if __name__ == '__main__':
    main()
