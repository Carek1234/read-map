import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';

const MODEL = process.env.EMBED_MODEL ?? 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app', 'data');
const books = JSON.parse(readFileSync(join(dataDir, 'books.json'), 'utf8'));

/** Tekst po knjizi. BEZ žanra (klasteri se moraju pojaviti sami — HANDOFF §6.3).
    MORA ostati identičan bookEmbedText() u src/app/data/book-data.ts. */
const textOf = (b) => `${b.title} — ${b.author}. ${b.tags.join(', ')}`;

console.log(`loading ${MODEL} (prvi put skida težine u lokalni cache)…`);
const extract = await pipeline('feature-extraction', MODEL);

const vectors = {};
const CHUNK = 32;
for (let i = 0; i < books.length; i += CHUNK) {
  const slice = books.slice(i, i + CHUNK);
  // mean pooling + normalize → gotovi rečenični vektori
  const out = await extract(slice.map(textOf), { pooling: 'mean', normalize: true });
  const rows = out.tolist(); // number[][]
  slice.forEach((b, j) => {
    vectors[b.id] = rows[j].map((x) => Math.round(x * 1e6) / 1e6);
  });
  console.log(`embedded ${Math.min(i + CHUNK, books.length)}/${books.length}`);
}

writeFileSync(join(dataDir, 'vectors.json'), JSON.stringify(vectors));
console.log(`wrote vectors.json — ${Object.keys(vectors).length} books, model ${MODEL}`);
