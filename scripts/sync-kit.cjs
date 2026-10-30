// Copies the shared Kip kit from Animations/mascot/ (the rig, the cat, the studio look, the house) into
// assets/kit/, where the composition and the board lab load it. Improve the kit in mascot/, then run:
//   node scripts/sync-kit.cjs
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', '..', 'mascot');
const dst = path.resolve(__dirname, '..', 'assets', 'kit');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['mascot.js', 'cat.js', 'studio.js', 'house.js']) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}
console.log('kit synced to assets/kit/');
