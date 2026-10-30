// Run the caption face probe (tools/faces.html) headless and write assets/film/caption-faces.json.
//   node tools/serve.cjs 5178 &   then   node tools/faces.cjs
// Rerun it after a retime or a restaged shot, then python scripts/overlays.py.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto('http://localhost:' + (process.env.PORT || 5178) + '/tools/faces.html');
  await page.waitForFunction(() => document.title === 'done' || document.title === 'error', null, { timeout: 15 * 60 * 1000 });
  console.log(await page.$eval('#log', (e) => e.textContent));
  const faces = await page.evaluate(() => window.__faces);
  await browser.close();
  if (!faces) process.exit(1);
  const out = path.join(__dirname, '..', 'assets', 'film', 'caption-faces.json');
  fs.writeFileSync(out, JSON.stringify(faces, null, 1) + '\n');
  for (const [id, r] of Object.entries(faces)) if (r.faceInBottom) console.log(id, JSON.stringify(r));
})();
