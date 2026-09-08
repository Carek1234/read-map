import { Book, Genre } from '../domain/book.model';
import { OlSearchResult } from './open-library.client';

const MAX_TAGS = 6;

/** Očisti OL subjecte u tagove: lowercase, bez duplikata, rez na MAX_TAGS. */
export function normalizeSubjects(subjects: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of subjects) {
    const tag = s.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length === MAX_TAGS) break;
  }
  return out;
}

/** Pretvori OL rezultat + odabrani žanr u domenski Book. OL nema žanr → parametar. */
export function olToBook(result: OlSearchResult, genre: Genre): Book {
  return {
    id: result.key,
    title: result.title,
    author: result.author,
    pages: result.pages ?? 0,
    tags: normalizeSubjects(result.subjects),
    genre,
  };
}
