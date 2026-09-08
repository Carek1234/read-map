import { OlSearchResult } from './open-library.client';
import { normalizeSubjects, olToBook } from './open-library.mapper';

describe('normalizeSubjects', () => {
  it('lowercase, bez duplikata, rez na 6', () => {
    const out = normalizeSubjects(['Fiction', 'FICTION', 'Science Fiction', 'a', 'b', 'c', 'd', 'e']);
    expect(out).toEqual(['fiction', 'science fiction', 'a', 'b', 'c', 'd']);
  });

  it('prazan ulaz ostaje prazan', () => {
    expect(normalizeSubjects([])).toEqual([]);
  });
});

describe('olToBook', () => {
  const result: OlSearchResult = {
    key: '/works/OL1W',
    title: 'Dune',
    author: 'Frank Herbert',
    year: 1965,
    pages: 607,
    subjects: ['Science fiction'],
  };

  it('mapira polja, žanr dolazi iz parametra', () => {
    expect(olToBook(result, 'adv')).toEqual({
      id: '/works/OL1W',
      title: 'Dune',
      author: 'Frank Herbert',
      pages: 607,
      tags: ['science fiction'],
      genre: 'adv',
    });
  });

  it('pages koji nedostaje → 0', () => {
    const book = olToBook({ ...result, pages: undefined }, 'crime');
    expect(book.pages).toBe(0);
    expect(book.genre).toBe('crime');
  });
});
