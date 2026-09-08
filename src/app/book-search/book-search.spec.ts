import { TestBed } from '@angular/core/testing';
import { BookSearch } from './book-search';
import { BookStore } from '../data/book-store';
import { OpenLibraryClient } from '../data/open-library.client';
import { STATE_PERSISTENCE } from '../data/persistence';
import { InMemoryPersistence } from '../data/in-memory-persistence';

const fakeOl = {
  search: async () => [{ key: '/works/OLnew', title: 'New Book', author: 'A', subjects: ['x'] }],
};

describe('BookSearch', () => {
  it('prikaže rezultate i doda knjigu u store', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: OpenLibraryClient, useValue: fakeOl },
        { provide: STATE_PERSISTENCE, useValue: new InMemoryPersistence() },
      ],
    });
    const fixture = TestBed.createComponent(BookSearch);
    const store = TestBed.inject(BookStore);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('input') as HTMLInputElement).value = 'new';
    (el.querySelector('button.search') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('New Book');

    const before = store.books().length;
    (el.querySelector('button.add') as HTMLButtonElement).click();
    expect(store.books().length).toBe(before + 1);
    expect(store.books().some((b) => b.id === '/works/OLnew')).toBe(true);
  });
});
