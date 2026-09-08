import { Book } from './book.model';
import { TagJaccard, VectorCosine } from './similarity';

const b = (id: string, tags: string[]): Book => ({
  id,
  title: id,
  author: '',
  pages: 1,
  tags,
  genre: 'adv',
});

const withVec = (id: string, vec: number[]): Book => ({
  id,
  title: id,
  author: '',
  pages: 1,
  tags: [],
  genre: 'adv',
  vec: new Float32Array(vec),
});

/** Test #2 (HANDOFF §14): Jaccard je simetričan i u [0, 1]. */
describe('TagJaccard', () => {
  const j = new TagJaccard();

  it('simetričan je', () => {
    const x = b('x', ['a', 'b', 'c']);
    const y = b('y', ['b', 'c', 'd']);
    expect(j.between(x, y)).toBe(j.between(y, x));
  });

  it('vraća vrijednosti u [0, 1] uz granične slučajeve', () => {
    const x = b('x', ['a', 'b']);
    const same = b('same', ['a', 'b']);
    const disjoint = b('d', ['p', 'q']);
    const empty = b('e', []);

    expect(j.between(x, same)).toBe(1); // identični tagovi
    expect(j.between(x, disjoint)).toBe(0); // bez preklapanja
    expect(j.between(x, empty)).toBe(0); // prazan skup ne dijeli s nulom

    for (const [p, q] of [
      [x, same],
      [x, disjoint],
      [same, disjoint],
    ] as const) {
      const v = j.between(p, q);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('VectorCosine', () => {
  const c = new VectorCosine();

  it('identični vektori → 1', () => {
    expect(c.between(withVec('a', [1, 2, 3]), withVec('b', [1, 2, 3]))).toBeCloseTo(1);
  });

  it('ortogonalni → 0', () => {
    expect(c.between(withVec('a', [1, 0]), withVec('b', [0, 1]))).toBeCloseTo(0);
  });

  it('suprotni → -1 (buildPairs takve odbaci jer traži w > 0)', () => {
    expect(c.between(withVec('a', [1, 0]), withVec('b', [-1, 0]))).toBeCloseTo(-1);
  });

  it('bez vektora → 0', () => {
    expect(c.between(b('x', ['t']), withVec('a', [1, 2]))).toBe(0);
  });

  it('različita duljina → 0', () => {
    expect(c.between(withVec('a', [1, 2]), withVec('b', [1, 2, 3]))).toBe(0);
  });
});
