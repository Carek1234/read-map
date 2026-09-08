import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BookSearch } from './book-search';
import { BookStore } from '../data/book-store';
import { OpenLibraryClient } from '../data/open-library.client';
import { STATE_PERSISTENCE } from '../data/persistence';
import { InMemoryPersistence } from '../data/in-memory-persistence';
import { EmbeddingService } from '../data/embedding.service';

const fakeOl = {
  search: async () => [{ key: '/works/OLnew', title: 'New Book', author: 'A', subjects: ['x'] }],
};
const fakeEmbeddings = { loading: signal(false), embed: async () => new Float32Array([0.1, 0.2, 0.3]) };

describe('BookSearch', () => {
  it('prikaže rezultate i doda knjigu u store', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: OpenLibraryClient, useValue: fakeOl },
        { provide: STATE_PERSISTENCE, useValue: new InMemoryPersistence() },
        { provide: EmbeddingService, useValue: fakeEmbeddings },
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

    (el.querySelector('button.add') as HTMLButtonElement).click();
    await fixture.whenStable(); // addBook je async (embedda knjigu)
    expect(store.mode()).toBe('own'); // dodavanje pokrene vlastitu mapu
    expect(store.books().some((b) => b.id === '/works/OLnew')).toBe(true);
  });
});
