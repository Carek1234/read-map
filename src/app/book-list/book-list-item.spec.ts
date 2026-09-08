import { TestBed } from '@angular/core/testing';
import { BookListItem } from './book-list-item';
import { BookEntry } from '../data/book-store';

const entry: BookEntry = {
  book: { id: 'x', title: 'Naslov', author: 'Autor', pages: 1, tags: [], genre: 'adv' },
  read: false,
  tier: 'suggested',
  heat: 0.5,
};

describe('BookListItem', () => {
  it('prikazuje naslov i emitira toggle s id-em', () => {
    const fixture = TestBed.createComponent(BookListItem);
    fixture.componentRef.setInput('entry', entry);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Naslov');

    let emitted: string | undefined;
    fixture.componentInstance.toggle.subscribe((id) => (emitted = id));
    (el.querySelector('input[type=checkbox]') as HTMLInputElement).click();
    expect(emitted).toBe('x');
  });
});
