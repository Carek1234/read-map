import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Genre } from '../domain/book.model';
import { BookStore } from '../data/book-store';
import { OlSearchResult, OpenLibraryClient } from '../data/open-library.client';
import { olToBook } from '../data/open-library.mapper';
import { EmbeddingService } from '../data/embedding.service';

@Component({
  selector: 'app-book-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <input #q type="search" placeholder="Search Open Library…" (keydown.enter)="search(q.value)" />
      <select [value]="genre()" (change)="genre.set($any($event.target).value)">
        <option value="adv">adventure</option>
        <option value="crime">crime</option>
      </select>
      <button class="search" (click)="search(q.value)">Search</button>
    </div>

    @if (embeddings.loading()) {
      <p class="hint">Embedding… (prvi put skida model, ~120 MB)</p>
    }

    @if (loading()) {
      <p class="hint">Searching…</p>
    } @else if (error()) {
      <p class="hint error">{{ error() }}</p>
    } @else if (results().length) {
      <ul class="results">
        @for (r of results(); track r.key) {
          <li>
            <span class="title">{{ r.title }}</span>
            <span class="author">{{ r.author }}</span>
            @if (r.year) {
              <span class="year">{{ r.year }}</span>
            }
            @if (existingIds().has(r.key)) {
              <span class="in-library">In library</span>
            } @else {
              <button class="add" (click)="add(r)">Add</button>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .bar { display: flex; gap: .5rem; margin-bottom: .75rem; }
    .bar input { flex: 1; padding: .4rem .5rem; }
    .results { list-style: none; margin: 0; padding: 0; }
    .results li { display: flex; gap: .6rem; align-items: baseline; padding: .3rem .2rem;
                  border-bottom: 1px solid rgba(128,128,128,.18); }
    .title { font-weight: 600; }
    .author { color: rgba(128,128,128,.9); font-size: .9em; }
    .year { color: rgba(128,128,128,.7); font-size: .8em; }
    .add, .in-library { margin-left: auto; font-size: .8em; }
    .in-library { color: rgba(128,128,128,.7); }
    .hint { opacity: .7; } .error { color: #c0392b; }
  `,
})
export class BookSearch {
  private readonly ol = inject(OpenLibraryClient);
  private readonly store = inject(BookStore);
  protected readonly embeddings = inject(EmbeddingService);

  protected readonly results = signal<OlSearchResult[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly genre = signal<Genre>('adv');

  /** Id-evi koji već postoje → red pokazuje "In library" umjesto "Add". */
  protected readonly existingIds = computed(() => new Set(this.store.books().map((b) => b.id)));

  protected async search(query: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.results.set(await this.ol.search(query));
    } catch {
      this.error.set('Search failed. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async add(result: OlSearchResult): Promise<void> {
    await this.store.addBook(olToBook(result, this.genre()));
  }
}
