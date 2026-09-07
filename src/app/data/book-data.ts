import { Book } from '../domain/book.model';
import { RawBook } from './raw-book.model';
import rawSeed from './books.json';

/** Ugrađeni seed skup u sirovom obliku. */
export const SEED_RAW = rawSeed as RawBook[];

/**
 * Jedino mjesto koje zna za `read`: pretvara ga u početni readIds, a s knjige
 * ga skida (jedini izvor istine je Set — HANDOFF bug #1).
 */
export function loadBooks(raw: RawBook[]): { books: Book[]; readIds: Set<string> } {
  const books: Book[] = raw.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    pages: b.pages,
    tags: b.tags,
    genre: b.genre,
  }));
  const readIds = new Set<string>(raw.filter((b) => b.read).map((b) => b.id));
  return { books, readIds };
}

/** Kratica: učitaj ugrađeni seed. */
export function loadSeed(): { books: Book[]; readIds: Set<string> } {
  return loadBooks(SEED_RAW);
}
