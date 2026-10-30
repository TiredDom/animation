"""Join every voice line in story order into one listening file, both voices balanced, for picking voices by ear.

    python -I scripts/readthrough.py

Each voice is lifted to the same median loudness (-21 LUFS), then every line is pulled 60% of the way to that median
(at most +9 / -6 dB), so a shout stays louder than a mumble but every word is heard; 0.4 s between lines; a -1 dBTP
limiter on the end. Writes assets/vo/readthrough.mp3. Not used in the film.
"""
import json
import pathlib
import re
import statistics
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = -21.0
GAP = 0.4


def lufs(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    m = re.search(r'I:\s+(-?[\d.]+) LUFS', err[err.rfind('Summary:'):])
    return float(m.group(1)) if m else None


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    lines = json.loads((ROOT / 'assets' / 'vo' / 'lines.json').read_text(encoding='utf-8'))
    level = {ln['id']: lufs(ROOT / ln['file']) for ln in lines}
    gain, median = {}, {}
    for who in ('kip', 'mom'):
        vals = [level[ln['id']] for ln in lines if ln['who'] == who and level[ln['id']] and level[ln['id']] > -60]
        median[who] = statistics.median(vals)
        gain[who] = TARGET - median[who]

    def line_gain(ln):
        own = level[ln['id']]
        pull = 0.0 if own is None or own < -60 else max(-6.0, min(9.0, 0.6 * (median[ln['who']] - own)))
        return gain[ln['who']] + pull
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        gap = tmp / 'gap.wav'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', str(GAP), str(gap)], check=True)
        parts = []
        for i, ln in enumerate(lines):
            part = tmp / f'{i:02d}.wav'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(ROOT / ln['file']), '-af', f'volume={line_gain(ln):.2f}dB',
                            '-ar', '44100', '-ac', '1', str(part)], check=True)
            parts += [part, gap]
        listing = tmp / 'list.txt'
        listing.write_text(''.join(f"file '{p.as_posix()}'\n" for p in parts), encoding='utf-8')
        out = ROOT / 'assets' / 'vo' / 'readthrough.mp3'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(listing),
                        '-af', 'alimiter=limit=0.89:level=false', '-c:a', 'libmp3lame', '-b:a', '160k', str(out)], check=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(out)],
                               capture_output=True, text=True, check=True).stdout)
    print(f'readthrough.mp3: {dur:.1f} s; gains Kip {gain["kip"]:+.1f} dB, Mom {gain["mom"]:+.1f} dB')


if __name__ == '__main__':
    main()
