import { Book, Pair } from './book.model';
import { Similarity, TagJaccard } from './similarity';

/**
 * Svi parovi s težinom > 0, izračunati jednom. NE reže na pragu — prag (0.2)
 * pripada frontieri (vidi discovery.ts), ne parovima. Da buildPairs reže na
 * pragu, `score` bi izgubio doprinose < 0.2 i krivulja otkrivanja bi se
 * promijenila (HANDOFF §6.1: 7773 parova s w>0 vs 1881 s w≥0.2).
 */
export function buildPairs(books: Book[], sim: Similarity = new TagJaccard()): Pair[] {
  const out: Pair[] = [];
  for (let i = 0; i < books.length; i++) {
    for (let j = i + 1; j < books.length; j++) {
      const w = sim.between(books[i], books[j]);
      if (w > 0) out.push({ source: books[i].id, target: books[j].id, w });
    }
  }
  return out;
}

/** Susjed u listi incidencije: druga strana brida i njegova težina. */
export interface Neighbor {
  id: string;
  w: number;
}

/**
 * Lista incidencije id → susjedi. Gradi se jednom pa `score`/`discoverFrom` ne
 * skeniraju sve parove za svaku knjigu (O(n²) → O(bridova)).
 */
export function adjacency(pairs: Pair[]): Map<string, Neighbor[]> {
  const adj = new Map<string, Neighbor[]>();
  const push = (from: string, to: string, w: number) => {
    const list = adj.get(from);
    if (list) list.push({ id: to, w });
    else adj.set(from, [{ id: to, w }]);
  };
  for (const p of pairs) {
    push(p.source, p.target, p.w);
    push(p.target, p.source, p.w);
  }
  return adj;
}
