import { Pair } from './book.model';
import { Neighbor } from './pairs';

type Adj = Map<string, Neighbor[]>;

/** Koliko čvorišta ponuditi kad još ništa nije pročitano (HANDOFF test #4). */
export const SEED_HUBS = 6;

/**
 * Otkriveni skup: sve pročitane + njihovih K najsličnijih susjeda.
 * Neotkriveno se ne crta. Vraćeni skup UKLJUČUJE i same pročitane knjige
 * (zato 4 pročitane pri K=5 daju 20, a ne 16 — HANDOFF test #5).
 *
 * Rubni slučaj: ako ništa nije pročitano, ponudi SEED_HUBS knjiga s najviše
 * veza kao ulazne točke (HANDOFF test #4).
 */
export function discoverFrom(adj: Adj, readIds: ReadonlySet<string>, k: number): Set<string> {
  const out = new Set<string>(readIds);
  for (const id of readIds) {
    const neighbors = adj.get(id);
    if (!neighbors) continue;
    [...neighbors]
      .sort((a, b) => b.w - a.w)
      .slice(0, k)
      .forEach((n) => out.add(n.id));
  }
  if (out.size === 0) {
    [...adj.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, SEED_HUBS)
      .forEach(([id]) => out.add(id));
  }
  return out;
}

/**
 * Frontiera: čvorovi jednu vezu (≥ prag) od otkrivenog, ali još neotkriveni.
 * Crtaju se kao anonimni krug + linija — postoje, ali ne znaš što su.
 * Ovdje, i samo ovdje, ulazi prag 0.2.
 */
export function frontierOf(
  pairs: Pair[],
  discovered: ReadonlySet<string>,
  threshold = 0.2,
): Set<string> {
  const frontier = new Set<string>();
  for (const p of pairs) {
    if (p.w < threshold) continue;
    const s = discovered.has(p.source);
    const t = discovered.has(p.target);
    if (s && !t) frontier.add(p.target);
    else if (t && !s) frontier.add(p.source);
  }
  return frontier;
}
