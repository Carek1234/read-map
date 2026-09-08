import { Injectable, computed, inject, signal } from '@angular/core';
import { Book } from '../domain/book.model';
import { buildPairs, adjacency } from '../domain/pairs';
import { discoverFrom, frontierOf } from '../domain/discovery';
import { Tier, heat, maxScore, tier } from '../domain/scoring';
import { bookEmbedText, loadSeed, seedSimilarity } from './book-data';
import { EmbeddingService } from './embedding.service';
import { STATE_PERSISTENCE } from './persistence';

const MODE_KEY = 'mode';
const OWN_BOOKS_KEY = 'ownBooks';
const OWN_READS_KEY = 'ownReads';

export type Mode = 'demo' | 'own';

/** Jedan zapis za listu: knjiga + izvedeno stanje. */
export interface BookEntry {
  book: Book;
  read: boolean;
  tier: Tier;
  heat: number;
}

/**
 * Srce aplikacije: stanje kao signali, sve izvedeno kao `computed`.
 * Dva izvora: demo (autorova biblioteka, seed) i own (posjetiteljeva mapa).
 */
@Injectable({ providedIn: 'root' })
export class BookStore {
  private readonly persistence = inject(STATE_PERSISTENCE);
  private readonly embeddings = inject(EmbeddingService);
  private readonly seed = loadSeed();

  /** 'demo' = autorova biblioteka (showcase); 'own' = posjetiteljeva mapa. */
  readonly mode = signal<Mode>('demo');

  // demo: seed + ephemeral pročitane (tinkeranje u demou se NE sprema)
  private readonly demoReads = signal<ReadonlySet<string>>(this.seed.readIds);
  // own: posjetiteljeve knjige i pročitane (persistirano)
  readonly ownBooks = signal<Book[]>([]);
  private readonly ownReads = signal<ReadonlySet<string>>(new Set());

  readonly k = signal(5);
  readonly threshold = signal(0.2);

  readonly books = computed(() => (this.mode() === 'demo' ? this.seed.books : this.ownBooks()));
  readonly readIds = computed(() => (this.mode() === 'demo' ? this.demoReads() : this.ownReads()));

  readonly pairs = computed(() => buildPairs(this.books(), seedSimilarity));
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

  async init(): Promise<void> {
    const [mode, ownBooks, ownReads] = await Promise.all([
      this.persistence.get<Mode>(MODE_KEY),
      this.persistence.get<Book[]>(OWN_BOOKS_KEY),
      this.persistence.get<string[]>(OWN_READS_KEY),
    ]);
    if (ownBooks) this.ownBooks.set(ownBooks);
    if (ownReads) this.ownReads.set(new Set(ownReads));
    if (mode) this.mode.set(mode);
  }

  /** Prebaci na vlastitu mapu (prazno platno). */
  startOwn(): void {
    this.setMode('own');
  }

  /** Vrati se na demo (autorovu biblioteku). */
  viewDemo(): void {
    this.setMode('demo');
  }

  toggleRead(id: string): void {
    if (this.mode() === 'demo') {
      this.demoReads.set(this.toggled(this.demoReads(), id)); // ephemeral
      return;
    }
    const next = this.toggled(this.ownReads(), id);
    this.ownReads.set(next);
    void this.persistence.set(OWN_READS_KEY, [...next]);
  }

  /** Dodaj knjigu u VLASTITU mapu (embedda je). Dodavanje uvijek znači "own". */
  async addBook(book: Book): Promise<boolean> {
    if (this.mode() === 'demo') this.startOwn();
    if (this.ownBooks().some((b) => b.id === book.id)) return false;
    let stored = book;
    try {
      stored = { ...book, vec: await this.embeddings.embed(bookEmbedText(book)) };
    } catch {
      // fallback: bez vec, poveže se preko tagova
    }
    this.ownBooks.update((list) => [...list, stored]);
    void this.persistence.set(OWN_BOOKS_KEY, this.ownBooks());
    return true;
  }

  setK(v: number): void {
    this.k.set(v);
  }

  setThreshold(v: number): void {
    this.threshold.set(v);
  }

  private setMode(m: Mode): void {
    this.mode.set(m);
    void this.persistence.set(MODE_KEY, m);
  }

  private toggled(set: ReadonlySet<string>, id: string): Set<string> {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }
}
