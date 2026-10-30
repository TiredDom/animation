// Serves this project on its own (no Animations/ folder around it, e.g. in a cloud checkout) for tools/lab.html,
// and saves the lab's sheets: POST /save/<name>.png writes boards/lab/<name>.png.
//   node tools/serve.cjs [port]   then open http://localhost:5178/tools/lab.html?name=s4&scene=4&w=480&cols=6
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..'), PORT = +process.argv[2] || 5178;
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const save = url.pathname.match(/^\/save\/([\w.-]+\.png)$/);
  if (req.method === 'POST' && save) {
    const dir = path.join(ROOT, 'boards', 'lab'), chunks = [];
    fs.mkdirSync(dir, { recursive: true });
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { fs.writeFileSync(path.join(dir, save[1]), Buffer.concat(chunks)); res.end('ok'); });
    return;
  }
  const file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`lab: http://localhost:${PORT}/tools/lab.html`));
