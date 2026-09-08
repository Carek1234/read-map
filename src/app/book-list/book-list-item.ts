import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BookEntry } from '../data/book-store';

@Component({
  selector: 'app-book-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li class="row" [class.read]="entry().read">
      <input
        type="checkbox"
        [checked]="entry().read"
        (change)="toggle.emit(entry().book.id)"
        [attr.aria-label]="'Read: ' + entry().book.title"
      />
      <span class="title">{{ entry().book.title }}</span>
      <span class="author">{{ entry().book.author }}</span>
      <span class="genre" [attr.data-genre]="entry().book.genre">{{ entry().book.genre }}</span>
      @if (label()) {
        <span class="heat" [style.opacity]="0.3 + 0.7 * entry().heat">{{ label() }}</span>
      }
    </li>
  `,
  styles: `
    .row { display: flex; gap: .6rem; align-items: baseline; padding: .35rem .2rem;
           border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent); }
    .row.read { opacity: .6; }
    .title { font-weight: 600; }
    .author { color: color-mix(in srgb, currentColor 60%, transparent); font-size: .9em; }
    .genre { margin-left: auto; font-size: .72em; text-transform: uppercase; letter-spacing: .06em; }
    .genre[data-genre='adv'] { color: #8b6cef; }
    .genre[data-genre='crime'] { color: #159f8b; }
    .heat { font-size: .72em; }
  `,
})
export class BookListItem {
  /** Ulaz: jedan izvedeni zapis. `required` = mora biti postavljen. */
  readonly entry = input.required<BookEntry>();
  /** Izlaz: id knjige koju treba prebaciti. Komponenta ne zna za store. */
  readonly toggle = output<string>();

  protected readonly label = computed(() => {
    const t = this.entry().tier;
    return t === 'suggested' ? 'suggested' : t === 'horizon' ? 'horizon' : '';
  });
}
