// What Kip's TV shows: a chunky pixel game. States (screen.show(state, opts)):
//   'game'        the hero on a night level
//   'died'        the level darkened red, the hero down, "YOU DIED"; opts.prompt adds "SPECTATE?  Y / N"
//   'spectating'  the level without the hero and the bar "SPECTATING · RETURN IN m:ss" (opts.left = seconds)
// All text in Itim (the channel face), loaded before the first paint.

const PX = 10;   // one game pixel on the 1280 × 720 screen

// the hero, 12 × 13 game pixels: hair, skin, eyes, a blue tunic, dark trousers, boots
const HERO = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '..hhssssss..',
  '..hseesees..',
  '..hssssssh..',
  '...ssssss...',
  '...bbbbbb...',
  '..bbbbbbbb..',
  '..sbbbbbbs..',
  '..sbbbbbbs..',
  '...pppppp...',
  '...pp..pp...',
  '..kkk..kkk..',
];
const COLORS = { h: '#2B1D16', s: '#E5A577', e: '#111111', x: '#111111', b: '#3E6FD8', p: '#2C2C3A', k: '#6A4426' };

function sprite(g, rows, x, y, px, { lying = false, dead = false } = {}) {
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      let ch = rows[r][c];
      if (ch === '.') continue;
      if (dead && ch === 'e') ch = 'x';
      g.fillStyle = COLORS[ch];
      if (lying) g.fillRect(x + (rows.length - 1 - r) * px, y + c * px, px, px);
      else g.fillRect(x + c * px, y + r * px, px, px);
    }
  }
}

function level(g, w, h) {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#132238');
  sky.addColorStop(1, '#24486A');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  // a pixel moon and two hills
  g.fillStyle = '#E8E2C8';
  g.fillRect(1010, 90, 60, 60);
  g.fillStyle = '#1C3550';
  for (let x = 0; x < w; x += PX) {
    const y = 470 - Math.round((Math.sin(x / 170) * 50 + Math.sin(x / 61) * 14) / PX) * PX;
    g.fillRect(x, y, PX, h - y);
  }
  // ground: grass on dirt, in game-pixel rows
  const top = 560;
  g.fillStyle = '#3F8F4A';
  g.fillRect(0, top, w, PX * 2);
  g.fillStyle = '#6B4A2E';
  g.fillRect(0, top + PX * 2, w, h - top - PX * 2);
  g.fillStyle = '#5A3D25';
  for (let x = 0; x < w; x += PX * 6) for (let y = top + PX * 4; y < h; y += PX * 4) g.fillRect(x + ((y / PX) % 2) * PX * 3, y, PX * 2, PX);
  // a floating block platform with a coin box, up on the right where no text goes
  g.fillStyle = '#B5652E';
  for (let i = 0; i < 4; i++) g.fillRect(1050 + i * 40, 330, 38, 38);
  g.fillStyle = '#E3B341';
  g.fillRect(1090, 330, 38, 38);
  return top;
}

function centeredText(g, text, x, y, size, color) {
  g.font = size + 'px Itim';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillText(text, x, y + size * 0.06);
  g.fillStyle = color;
  g.fillText(text, x, y);
}

export const clock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

export function paintScreens(screen) {
  screen.painters.game = (g, w, h) => {
    const top = level(g, w, h);
    sprite(g, HERO, 380, top - HERO.length * PX, PX);
  };
  screen.painters.died = (g, w, h, o) => {
    const top = level(g, w, h);
    sprite(g, HERO, 1000, top - 12 * PX, PX, { lying: true, dead: true });
    g.fillStyle = 'rgba(70, 6, 6, 0.62)';
    g.fillRect(0, 0, w, h);
    centeredText(g, 'YOU DIED', w / 2, o.prompt ? h * 0.4 : h / 2, 168, '#E8453C');
    if (o.prompt) {
      // SPECTATE?  Y / N, with Y boxed once he presses it
      g.font = '70px Itim';
      const parts = ['SPECTATE?', 'Y', '/', 'N'], gap = 42;
      const widths = parts.map((p) => g.measureText(p).width);
      let x = w / 2 - (widths.reduce((a, b) => a + b, 0) + gap * 3) / 2;
      const y = h * 0.64;
      parts.forEach((p, i) => {
        const cx = x + widths[i] / 2;
        if (o.select && p === 'Y') {
          g.fillStyle = '#FFFFFF';
          g.beginPath(); g.roundRect(cx - 40, y - 46, 80, 92, 14); g.fill();
          centeredText(g, p, cx, y, 70, '#5A0C0C');
        } else {
          centeredText(g, p, cx, y, 70, '#FFFFFF');
        }
        x += widths[i] + gap;
      });
    }
  };
  screen.painters.spectating = (g, w, h, o) => {
    level(g, w, h);
    g.fillStyle = 'rgba(8, 10, 16, 0.6)';
    g.fillRect(0, h * 0.27, w, h * 0.42);
    centeredText(g, 'SPECTATING', w / 2, h * 0.4, 120, '#FFFFFF');
    centeredText(g, 'RETURN IN ' + clock(o.left == null ? 300 : o.left), w / 2, h * 0.58, 76, '#FFFFFF');
  };
  screen.show('game');
}
