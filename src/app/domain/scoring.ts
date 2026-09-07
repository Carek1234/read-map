import { Neighbor } from './pairs';

/**
 * Obavezni pod topline. Bez njega: odznačiš zadnju pročitanu → svi rezultati
 * padnu na 0 → tekući maksimum padne na ~0 → toplina podivlja → čvorovi se
 * stisnu u hrpu (HANDOFF §4, bug #6; izmjereno: rasprostranjenost 820 px → kolaps).
 */
export const HEAT_FLOOR = 0.8;

type Adj = Map<string, Neighbor[]>;

/** Zbroj sličnosti prema pročitanim susjedima. Pročitana knjiga ima score 0. */
export function score(bookId: string, adj: Adj, readIds: ReadonlySet<string>): number {
  if (readIds.has(bookId)) return 0;
  const neighbors = adj.get(bookId);
  if (!neighbors) return 0;
  let s = 0;
  for (const n of neighbors) if (readIds.has(n.id)) s += n.w;
  return s;
}

/**
 * Nazivnik za toplinu: najveći score, ali nikad ispod poda. Računa se nad SVIM
 * knjigama jednom po preračunu, ne po čvoru.
 */
export function maxScore(ids: string[], adj: Adj, readIds: ReadonlySet<string>): number {
  let max = HEAT_FLOOR;
  for (const id of ids) {
    const s = score(id, adj, readIds);
    if (s > max) max = s;
  }
  return max;
}

/** Toplina u [0, 1]. Pročitana = 1. Ostalo = score / max, srezano na 1. */
export function heat(bookId: string, adj: Adj, readIds: ReadonlySet<string>, max: number): number {
  if (readIds.has(bookId)) return 1;
  return Math.min(1, score(bookId, adj, readIds) / max);
}

export type Tier = 'read' | 'suggested' | 'horizon';

/** Stanje čvora. Horizont = još nije povezan ni s čim pročitanim. */
export function tier(bookId: string, adj: Adj, readIds: ReadonlySet<string>): Tier {
  if (readIds.has(bookId)) return 'read';
  return score(bookId, adj, readIds) > 0 ? 'suggested' : 'horizon';
}
