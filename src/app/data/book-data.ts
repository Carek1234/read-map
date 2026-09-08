import { Book } from '../domain/book.model';
import { Similarity, TagJaccard, VectorCosine } from '../domain/similarity';
import { RawBook } from './raw-book.model';
import rawSeed from './books.json';
import vectorsJson from './vectors.json';

/** Ugrađeni seed skup u sirovom obliku. */
export const SEED_RAW = rawSeed as RawBook[];
const VECTORS = vectorsJson as Record<string, number[]>;

/** Jesu li embeddingi generirani? Prazan vectors.json → fallback na TagJaccard. */
export const hasVectors = Object.keys(VECTORS).length > 0;

/** Mjera za seed: VectorCosine ako ima vektora, inače TagJaccard. */
export const seedSimilarity: Similarity = hasVectors ? new VectorCosine() : new TagJaccard();

/**
 * Jedino mjesto koje zna za `read`: pretvara ga u početni readIds, a s knjige
 * ga skida (jedini izvor istine je Set — HANDOFF bug #1).
 */
export function loadBooks(raw: RawBook[]): { books: Book[]; readIds: Set<string> } {
  const books: Book[] = raw.map((b) => {
    const vec = VECTORS[b.id];
    return {
      id: b.id,
      title: b.title,
      author: b.author,
      pages: b.pages,
      tags: b.tags,
      genre: b.genre,
      ...(vec ? { vec: new Float32Array(vec) } : {}),
    };
  });
  const readIds = new Set<string>(raw.filter((b) => b.read).map((b) => b.id));
  return { books, readIds };
}

/** Kratica: učitaj ugrađeni seed. */
export function loadSeed(): { books: Book[]; readIds: Set<string> } {
  return loadBooks(SEED_RAW);
}

/** Tekst za embedding. MORA biti identičan `textOf` u scripts/embed-seed.mjs. */
export function bookEmbedText(b: Book): string {
  return `${b.title} — ${b.author}. ${b.tags.join(', ')}`;
}
