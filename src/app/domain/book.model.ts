/**
 * Domenski modeli. Čisti TypeScript — NULA importa iz @angular/*.
 *
 * Bilješka o `read`: status čitanja NE živi na knjizi. Jedini izvor istine je
 * `readIds: Set<string>` u sloju stanja. Prototip je držao `boolean` na kopiji
 * objekta i to je bio bug #1 iz HANDOFF-a (traka je mijenjala jedan objekt, graf
 * se crtao iz drugog). Zato ga ovdje namjerno nema.
 */
export type Genre = 'adv' | 'crime';

export interface Book {
  id: string;
  title: string;
  author: string;
  pages: number;
  tags: string[];
  genre: Genre;
  /** Faza 4: embedding vektor. Dok ga nema, mjera je TagJaccard nad `tags`. */
  vec?: Float32Array;
}

/** Neusmjeren brid grafa: težina `w` je sličnost dviju knjiga u [0, 1]. */
export interface Pair {
  source: string;
  target: string;
  w: number;
}
