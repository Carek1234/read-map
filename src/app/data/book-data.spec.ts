import { loadBooks, loadSeed } from './book-data';
import { RawBook } from './raw-book.model';

describe('loadBooks', () => {
  it('read zastavica postaje readIds, a s knjige nestaje', () => {
    const raw: RawBook[] = [
      { id: 'a', title: 'A', author: '', pages: 1, read: true, tags: [], genre: 'adv' },
      { id: 'b', title: 'B', author: '', pages: 1, read: false, tags: [], genre: 'crime' },
    ];
    const { books, readIds } = loadBooks(raw);
    expect(readIds.has('a')).toBe(true);
    expect(readIds.has('b')).toBe(false);
    expect('read' in books[0]).toBe(false);
  });

  it('seed ima 202 knjige i 4 pročitane', () => {
    const { books, readIds } = loadSeed();
    expect(books.length).toBe(202);
    expect(readIds.size).toBe(4);
  });
});
