"""Record Kip's and Mom's lines (SPEC.md § SHOTS) with ElevenLabs, one file per line, plus the voice auditions.

    python -I scripts/voices.py                 record every line that changed or has no take yet
    python -I scripts/voices.py --only k08,m05  record just these again
    python -I scripts/voices.py --audition      record the audition lines for every candidate voice

Writes assets/vo/<id>.mp3, assets/vo/<id>.json (text, voice, settings, ElevenLabs' character alignment for the
mouths and captions) and assets/vo/lines.json (every line with its duration). Auditions go to assets/vo/auditions/.
The key comes from the user's environment and is never printed. Licence: the user's ElevenLabs Creator plan
(commercial use); see assets/vo/SOURCES.md.
"""
import base64
import json
import os
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'vo'
BASE = 'https://api.elevenlabs.io'
MODEL = 'eleven_v4'   # the house model; no audio tags in the text (the user's rule)

# Library voices are added to the user's ElevenLabs voices before the API can use them: (name, voice id, label).
CANDIDATES = {
    'kip': [
        ('Aaron - Conversational American Male', 'B6uUx2p7cRgxseOUyP6P', 'aaron'),
        ('Jett - Gritty and Spunky Young Hero', '6IwYbsNENZgAB1dtBZDp', 'jett'),
        ('Chrisva - Animated and Vivacious', 'wIVKcZbkr7yia2bPb1Hm', 'chrisva'),
    ],
    'mom': [
        ('Jordan - Millennial Mom', 'mtV3PLomLvma8XKmZIju', 'jordan'),
        ('Lena - Engaging and Relatable Mom', 'roYauZ4bOLAKvVZTPLre', 'lena'),
        ('Sabine - Fun and Dynamic Narrator', 'BBz8H3kffyIUs3SYExlh', 'sabine'),
    ],
}
AUDITION = {
    'kip': 'How does she know about the chips?! ... Hidden present. Invisible me. ... Easy.',
    'mom': "Spectator mode? Sweetie. I've had it since I was your age. How do you think I know about the chips?",
}

# The cast the user picked from the auditions on 2026-10-30: voice id and [stability, similarity, style, speed].
# Kip loose and quick, Mom steadier and unhurried.
CAST = {
    'kip': {'voice': 'wIVKcZbkr7yia2bPb1Hm', 'name': 'Chrisva', 'settings': [0.4, 0.8, 0.35, 1.0]},
    'mom': {'voice': 'BBz8H3kffyIUs3SYExlh', 'name': 'Sabine', 'settings': [0.5, 0.8, 0.25, 1.0]},
}

# Every spoken line in SPEC.md, by shot. The delivery notes are for the mix (whisper, muffle), not the text.
LINES = [
    ('k01', 'kip', '...Uh. Hello?'),
    ('k02', 'kip', 'Okay. Okay, okay, okay.'),
    ('k03', 'kip', 'Ew.'),
    ('k04', 'kip', 'You can see me?'),
    ('k05', 'kip', 'Rude.'),
    ('k06', 'kip', 'Mom? MOM.'),
    ('m01', 'mom', "No, he won't find it. I hid it where he'll never look."),
    ('m02', 'mom', "And he still thinks I don't know about the chips under the couch."),
    ('k07', 'kip', 'How does she know about the chips?!'),
    ('k08', 'kip', 'Hidden present. Invisible me. ... Easy.'),
    ('k09', 'kip', 'Shoes... shoes... shoes...'),
    ('k10', 'kip', 'Dad?'),
    ('k11', 'kip', 'I can never unsee that.'),
    ('m03', 'mom', 'Hup!'),
    ('k12', 'kip', 'Bingo.'),
    ('k13', 'kip', 'Oh, come ON.'),
    ('k14', 'kip', 'Socks.'),
    ('k15', 'kip', 'Nobody ever checks the attic.'),            # whispered: softened in the mix
    ('k16', 'kip', 'Baby pictures... no...'),                   # muffled inside the trunk: filtered in the mix
    ('k17', 'kip', "...Spectators can't be touched."),
    ('m04', 'mom', 'Looking for something?'),
    ('k18', 'kip', 'AAAAAAH!'),
    ('k19', 'kip', 'MOM?! You... you have...'),
    ('m05', 'mom', "Spectator mode? Sweetie. I've had it since I was your age."),
    ('m06', 'mom', 'How do you think I know about the chips?'),
    ('k20', 'kip', 'Every time I got caught... that was YOU?'),
    ('m07', 'mom', "One more thing. If your timer hits zero before you're back in your body... you stay like this. Forever."),
    ('k21', 'kip', 'Okay, bye!'),
    ('k22', 'kip', 'No. No no no. Where am I?!'),
    ('m08', 'mom', 'Warmer...'),
    ('k23', 'kip', 'Gah! Your body is so creepy.'),
    ('m09', 'mom', 'Colder.'),
    ('k24', 'kip', 'Laundry!'),
    ('k25', 'kip', 'Coat!'),
    ('k26', 'kip', 'Cushions!'),
    ('m10', 'mom', 'You know, you could just ask.'),
    ('k27', 'kip', "Then you'd win!"),
    ('m11', 'mom', 'Mm-hm.'),
    ('k28', 'kip', 'I just wanted to see my present.'),         # quiet
    ('k29', 'kip', '...What?'),
    ('k30', 'kip', 'You know where I am?'),
    ('k31', 'kip', 'THERE I AM!'),
    ('k32', 'kip', "Haah! I'm back! I'm..."),
    ('k33', 'kip', '...Why is my lip sticky?'),
    ('m12', 'mom', 'Happy birthday, sweetie.'),
    ('k34', 'kip', 'Mom. About last night...'),
    ('m13', 'mom', 'No idea what you mean.'),
    ('m14', 'mom', "Your present's been under your bed the whole time."),
    ('k35', 'kip', '...I slept on it.'),
    ('m15', 'mom', 'All night.'),
    ('k36', 'kip', '...I look like Dad.'),
    ('k37', 'kip', 'MOM!'),
    ('m16', 'mom', 'Happy birthday!'),
    ('k38', 'kip', '...EVERYONE has it?!'),
]


def key():
    k = os.environ.get('ELEVENLABS_API_KEY')
    if not k:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment') as h:
            k = winreg.QueryValueEx(h, 'ELEVENLABS_API_KEY')[0]
    return k.strip()


def request(method, path, body=None, params=None):
    url = BASE + path + ('?' + urllib.parse.urlencode(params) if params else '')
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(4):
        req = urllib.request.Request(url, data=data, method=method, headers={
            'xi-api-key': key(), 'Content-Type': 'application/json', 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(3 * (attempt + 1))
                continue
            sys.exit(f'HTTP {e.code} on {path}: {e.read().decode("utf-8", "replace")[:400]}')


def ensure_voices(wanted):
    """Add any of these library voices (ids) that is not in the user's voices yet, named '<voice> (Kip audition)'."""
    mine = {v['voice_id'] for v in request('GET', '/v1/voices')['voices']}
    for who, cands in CANDIDATES.items():
        for name, vid, _ in cands:
            if vid in mine or vid not in wanted:
                continue
            found = request('GET', '/v1/shared-voices', params={'search': name, 'page_size': 50})['voices']
            match = next((v for v in found if v['voice_id'] == vid), None)
            if not match:
                sys.exit(f'library voice not found: {name} ({vid})')
            short = name.split(' - ')[0]
            request('POST', f"/v1/voices/add/{match['public_owner_id']}/{vid}", {'new_name': f'{short} (Kip audition)'})
            print(f'added {short} to the account')


def tts(voice, text, settings):
    stab, sim, style, speed = settings
    return request('POST', f'/v1/text-to-speech/{voice}/with-timestamps',
                   {'text': text, 'model_id': MODEL,
                    'voice_settings': {'stability': stab, 'similarity_boost': sim, 'style': style,
                                       'use_speaker_boost': True, 'speed': speed}},
                   params={'output_format': 'mp3_44100_128'})


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out), 3)


def audition():
    ensure_voices({vid for cands in CANDIDATES.values() for _, vid, _ in cands})
    folder = OUT / 'auditions'
    folder.mkdir(parents=True, exist_ok=True)
    for who, cands in CANDIDATES.items():
        for i, (name, vid, label) in enumerate(cands, 1):
            res = tts(vid, AUDITION[who], CAST[who]['settings'])
            path = folder / f'{who}-{i}-{label}.mp3'
            path.write_bytes(base64.b64decode(res['audio_base64']))
            print(f'{path.name}: {duration(path):.2f} s')


def record(only=None):
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for lid, who, text in LINES:
        cast = CAST[who]
        meta_path, audio_path = OUT / f'{lid}.json', OUT / f'{lid}.mp3'
        old = json.loads(meta_path.read_text(encoding='utf-8')) if meta_path.exists() else {}
        stale = (old.get('text') != text or old.get('voice') != cast['voice'] or old.get('settings') != cast['settings']
                 or old.get('model') != MODEL or not audio_path.exists())
        if (only and lid in only) or (not only and stale):
            res = tts(cast['voice'], text, cast['settings'])
            audio_path.write_bytes(base64.b64decode(res['audio_base64']))
            old = {'id': lid, 'who': who, 'text': text, 'voice': cast['voice'], 'voice_name': cast['name'],
                   'settings': cast['settings'], 'model': MODEL,
                   'alignment': res.get('normalized_alignment') or res.get('alignment')}
            meta_path.write_text(json.dumps(old, indent=1), encoding='utf-8')
            print(f'recorded {lid} ({cast["name"]})')
        al = old.get('alignment') or {}
        starts, ends = al.get('character_start_times_seconds') or [0], al.get('character_end_times_seconds') or [0]
        index.append({'id': lid, 'who': who, 'text': text, 'voice': cast['name'], 'file': f'assets/vo/{lid}.mp3',
                      'duration': duration(audio_path), 'speech': [round(starts[0], 3), round(ends[-1], 3)]})
    (OUT / 'lines.json').write_text(json.dumps(index, indent=1), encoding='utf-8')
    total = sum(x['duration'] for x in index)
    print(f'{len(index)} lines, {total:.1f} s of speech files')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    if '--audition' in sys.argv:
        audition()
    else:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
        ensure_voices({c['voice'] for c in CAST.values()})
        record(only)


if __name__ == '__main__':
    main()
