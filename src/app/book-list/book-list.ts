import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BookStore } from '../data/book-store';
import { BookListItem } from './book-list-item';

@Component({
  selector: 'app-book-list',
  imports: [BookListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="list">
      @for (entry of sorted(); track entry.book.id) {
        <app-book-list-item [entry]="entry" (toggle)="store.toggleRead($event)" />
      }
    </ul>
  `,
  styles: `.list { list-style: none; margin: 0; padding: 0; }`,
})
export class BookList {
  protected readonly store = inject(BookStore);

  /**
   * Prikazujemo SVE knjige (ne samo discovered): u fazi 1 nema grafa ni
   * pretrage, pa lista mora dati način da označiš bilo što. Filtriranje na
   * discovered je vizualna priča grafa (faza 3).
   * Sort: pročitane prve, zatim po toplini (prijedlozi izađu gore).
   */
  protected readonly sorted = computed(() =>
    [...this.store.entries()].sort((a, b) => {
      if (a.read !== b.read) return a.read ? -1 : 1;
      return b.heat - a.heat;
    }),
  );
}
