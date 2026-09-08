import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BookStore } from './data/book-store';
import { BookList } from './book-list/book-list';

@Component({
  selector: 'app-root',
  imports: [BookList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(BookStore);
  protected readonly total = computed(() => this.store.books().length);
  protected readonly readCount = computed(() => this.store.readIds().size);
  protected readonly discoveredCount = computed(() => this.store.discovered().size);
}
