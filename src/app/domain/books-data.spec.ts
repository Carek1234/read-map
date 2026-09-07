import booksJson from '../data/books.json';

/**
 * Test #1 (HANDOFF §14): jedinstvenost id-eva u books.json.
 * Duplikat id-a (`wild` za Into the Wild i Divlja) bio je bug #2 iz prototipa.
 */
describe('books.json', () => {
  const raw = booksJson as Array<{ id: string }>;

  it('svaki id je jedinstven', () => {
    const ids = raw.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sadrži 202 knjige', () => {
    expect(raw.length).toBe(202);
  });
});
