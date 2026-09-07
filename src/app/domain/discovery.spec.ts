import { adjacency, buildPairs } from './pairs';
import { SEED_HUBS, discoverFrom, frontierOf } from './discovery';
import { loadSeed } from '../data/book-data';

describe('otkrivanje', () => {
  const { books, readIds } = loadSeed();
  const pairs = buildPairs(books);
  const adj = adjacency(pairs);

  /** Test #4 (HANDOFF §14): prazan readIds vrati 6 početnih čvorišta. */
  it('prazan readIds ponudi 6 čvorišta po stupnju', () => {
    expect(discoverFrom(adj, new Set(), 5).size).toBe(SEED_HUBS);
  });

  /** Test #5 (HANDOFF §14): K=5 i 4 pročitane daju točno 20 otkrivenih. */
  it('K=5 i 4 pročitane knjige daju točno 20 otkrivenih', () => {
    expect(readIds.size).toBe(4);
    expect(discoverFrom(adj, readIds, 5).size).toBe(20);
  });

  it('frontiera je disjunktna s otkrivenim', () => {
    const discovered = discoverFrom(adj, readIds, 5);
    const frontier = frontierOf(pairs, discovered);
    for (const id of frontier) expect(discovered.has(id)).toBe(false);
    expect(frontier.size).toBeGreaterThan(0);
  });
});
