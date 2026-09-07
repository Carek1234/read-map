import { Book } from './book.model';

/**
 * JEDINA mjera sličnosti. Sve ostalo (parovi, rezultat, otkrivanje) računa se
 * preko ovog sučelja pa je zamjena mjere promjena u DI-ju, ne refaktor.
 *
 * HANDOFF §4/§6.2: TagJaccard je dokazano pokvaren (Moby Dick ↔ Rebecca = 60 %).
 * Ubacuje se sučelje odmah da bi VectorCosine u fazi 4 bio zamjena, ne prepravka.
 */
export interface Similarity {
  /** Simetrična sličnost u [0, 1]. */
  between(a: Book, b: Book): number;
}

/** Port iz prototipa — za bacanje kad stignu embeddingi. Jaccard nad tagovima. */
export class TagJaccard implements Similarity {
  between(a: Book, b: Book): number {
    const A = new Set(a.tags);
    let inter = 0;
    for (const t of b.tags) if (A.has(t)) inter++;
    const union = A.size + b.tags.length - inter;
    return union === 0 ? 0 : inter / union;
  }
}

/** Faza 4: kosinusna sličnost embeddinga. Bez vektora vraća 0. */
export class VectorCosine implements Similarity {
  between(a: Book, b: Book): number {
    const u = a.vec, v = b.vec;
    if (!u || !v || u.length !== v.length) return 0;
    let dot = 0, nu = 0, nv = 0;
    for (let i = 0; i < u.length; i++) {
      dot += u[i] * v[i];
      nu += u[i] * u[i];
      nv += v[i] * v[i];
    }
    if (nu === 0 || nv === 0) return 0;
    return dot / (Math.sqrt(nu) * Math.sqrt(nv));
  }
}
