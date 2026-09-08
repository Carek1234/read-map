import { Injectable, computed, inject, signal } from '@angular/core';
import { Book } from '../domain/book.model';
import { buildPairs, adjacency } from '../domain/pairs';
import { discoverFrom, frontierOf } from '../domain/discovery';
import { Tier, heat, maxScore, tier } from '../domain/scoring';
import { loadSeed } from './book-data';
import { STATE_PERSISTENCE } from './persistence';

const READ_IDS_KEY = 'readIds';

/** Jedan zapis za listu: knjiga + izvedeno stanje. */
export interface BookEntry {
  book: Book;
  read: boolean;
  tier: Tier;
  heat: number;
}

/**
 * Srce aplikacije: stanje kao signali, sve izvedeno kao `computed`.
 * Promijeniš `readIds` → `discovered`/`frontier`/`entries` se sami preračunaju.
 * Ništa se ne poziva ručno — bug "zaboravih recompute" postaje nemoguć (HANDOFF §3).
 */
@Injectable({ providedIn: 'root' })
export class BookStore {
  private readonly persistence = inject(STATE_PERSISTENCE);
  private readonly seed = loadSeed();

  // --- stanje (jedini izvori istine) ---
  readonly books = signal<Book[]>(this.seed.books);
  readonly readIds = signal<ReadonlySet<string>>(this.seed.readIds);
  readonly k = signal(5);
  readonly threshold = signal(0.2);

  // --- izvedeno (memoizirano, lijeno) ---
  readonly pairs = computed(() => buildPairs(this.books()));
  readonly adj = computed(() => adjacency(this.pairs()));
  readonly discovered = computed(() => discoverFrom(this.adj(), this.readIds(), this.k()));
  readonly frontier = computed(() => frontierOf(this.pairs(), this.discovered(), this.threshold()));
  readonly heatMax = computed(() => maxScore(this.books().map((b) => b.id), this.adj(), this.readIds()));

  readonly entries = computed<BookEntry[]>(() => {
    const adj = this.adj();
    const read = this.readIds();
    const max = this.heatMax();
    return this.books().map((b) => ({
      book: b,
      read: read.has(b.id),
      tier: tier(b.id, adj, read),
      heat: heat(b.id, adj, read, max),
    }));
  });

  /** Učitaj spremljeno stanje. Zove se jednom na startu (app initializer). */
  async init(): Promise<void> {
    const stored = await this.persistence.get<string[]>(READ_IDS_KEY);
    if (stored) this.readIds.set(new Set(stored)); // hidracija ne sprema natrag
  }

  /** Označi/odznači pročitano. Novi Set → signal detektira promjenu. */
  toggleRead(id: string): void {
    const next = new Set(this.readIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.readIds.set(next);
    void this.persist();
  }

  setK(value: number): void {
    this.k.set(value);
  }

  setThreshold(value: number): void {
    this.threshold.set(value);
  }

  private persist(): Promise<void> {
    return this.persistence.set(READ_IDS_KEY, [...this.readIds()]);
  }
}
