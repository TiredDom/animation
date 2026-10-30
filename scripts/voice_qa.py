"""Measure every voice take (assets/vo/lines.json): loudness, peak, speaking rate and dead air, and flag the outliers.

    python -I scripts/voice_qa.py

Flags: a take more than 4 LU off the cast's median loudness, a true peak above -1 dBTP, dead air over 0.6 s before or
after the words (from ElevenLabs' alignment), or a speaking rate far from the cast's own (fewer than 1.2 or more than
4.5 words a second on lines of 3+ words). Numbers only: someone still has to listen.
"""
import json
import pathlib
import re
import statistics
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def loudness(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    summary = err[err.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', summary)
    p = re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summary)
    return (float(i.group(1)) if i else None), (float(p.group(1)) if p and 'inf' not in p.group(1) else None)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    lines = json.loads((ROOT / 'assets' / 'vo' / 'lines.json').read_text(encoding='utf-8'))
    rows = []
    for ln in lines:
        lufs, peak = loudness(ROOT / ln['file'])
        words = len(ln['text'].replace('...', ' ').split())
        s, e = ln['speech']
        span = max(e - s, 0.01)
        rows.append({**ln, 'lufs': lufs, 'peak': peak, 'words': words, 'wps': words / span,
                     'lead': s, 'tail': ln['duration'] - e})
    for who in ('kip', 'mom'):
        mine = [r for r in rows if r['who'] == who]
        med = statistics.median([r['lufs'] for r in mine if r['lufs'] is not None and r['lufs'] > -60])
        print(f'\n{who.upper()} ({mine[0]["voice"]}): {len(mine)} lines, median {med:.1f} LUFS')
        for r in mine:
            flags = []
            if r['lufs'] is None or r['lufs'] < -60:
                flags.append('too short to gate')
            elif abs(r['lufs'] - med) > 4:
                flags.append(f'loudness {r["lufs"] - med:+.1f} LU')
            if r['peak'] is not None and r['peak'] > -1:
                flags.append(f'peak {r["peak"]:.1f}')
            if r['lead'] > 0.6:
                flags.append(f'{r["lead"]:.2f} s before')
            if r['tail'] > 0.6:
                flags.append(f'{r["tail"]:.2f} s after')
            if r['words'] >= 3 and not 1.2 <= r['wps'] <= 4.5:
                flags.append(f'{r["wps"]:.1f} words/s')
            lufs = f'{r["lufs"]:6.1f}' if r['lufs'] is not None else '   n/a'
            print(f'  {r["id"]}  {r["duration"]:5.2f} s  {lufs} LUFS  {r["wps"]:4.1f} w/s  {"; ".join(flags) or "ok":28}  {r["text"]}')


if __name__ == '__main__':
    main()
