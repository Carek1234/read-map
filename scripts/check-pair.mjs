import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app', 'data');
const books = JSON.parse(readFileSync(join(dataDir, 'books.json'), 'utf8'));
const vectors = JSON.parse(readFileSync(join(dataDir, 'vectors.json'), 'utf8'));

const [id1, id2] = process.argv.slice(2);
if (!id1 || !id2) {
  console.error('Usage: npm run check:pair -- <id1> <id2>');
  process.exit(1);
}

const cos = (u, v) => {
  let dot = 0, nu = 0, nv = 0;
  for (let i = 0; i < u.length; i++) {
    dot += u[i] * v[i];
    nu += u[i] * u[i];
    nv += v[i] * v[i];
  }
  return dot / (Math.sqrt(nu) * Math.sqrt(nv));
};
const title = (id) => books.find((b) => b.id === id)?.title ?? id;

const u = vectors[id1], v = vectors[id2];
if (!u || !v) {
  console.error(`No vector for ${!u ? id1 : id2}. Run: npm run embed:seed`);
  process.exit(1);
}
console.log(`${title(id1)} ↔ ${title(id2)} = ${(cos(u, v) * 100).toFixed(1)}%`);
