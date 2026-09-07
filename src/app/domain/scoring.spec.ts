import { adjacency, buildPairs } from './pairs';
import { HEAT_FLOOR, heat, maxScore, score } from './scoring';
import { loadSeed } from '../data/book-data';

/**
 * Test #3 (HANDOFF §14, regresija bug #6): toplina koristi pod 0.8 i
 * odznačavanje pročitanih NE razbija raspon topline ostalih.
 */
describe('toplina — pod 0.8', () => {
  const { books, readIds } = loadSeed();
  const adj = adjacency(buildPairs(books));
  const ids = books.map((b) => b.id);

  it('maxScore nikad ne padne ispod poda', () => {
    expect(maxScore(ids, adj, readIds)).toBeGreaterThanOrEqual(HEAT_FLOOR);
    expect(maxScore(ids, adj, new Set())).toBe(HEAT_FLOOR);
  });

  it('pod je nosiv: bez njega bi nazivnik pri praznom readIds bio 0', () => {
    let rawMax = 0;
    for (const id of ids) rawMax = Math.max(rawMax, score(id, adj, new Set()));
    expect(rawMax).toBeLessThan(HEAT_FLOOR); // 0 → dijeljenje bi podivljalo
  });

  it('odznačavanje svih pročitanih drži toplinu konačnom, ne u hrpi', () => {
    const maxBefore = maxScore(ids, adj, readIds);
    for (const id of ids) {
      const h = heat(id, adj, readIds, maxBefore);
      expect(Number.isFinite(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1);
    }
    const maxAfter = maxScore(ids, adj, new Set());
    expect(maxAfter).toBe(HEAT_FLOOR);
    for (const id of ids) {
      const h = heat(id, adj, new Set(), maxAfter);
      expect(h).toBe(0); // sve pada na 0, nijedno na NaN/∞
    }
  });
});
