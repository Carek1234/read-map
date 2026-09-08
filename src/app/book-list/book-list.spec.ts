import { TestBed } from '@angular/core/testing';
import { BookList } from './book-list';
import { STATE_PERSISTENCE } from '../data/persistence';
import { InMemoryPersistence } from '../data/in-memory-persistence';

describe('BookList', () => {
  it('renderira sve knjige, pročitana je prva', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: STATE_PERSISTENCE, useValue: new InMemoryPersistence() }],
    });
    const fixture = TestBed.createComponent(BookList);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('app-book-list-item').length).toBe(202);
    expect(el.querySelector('.row')?.classList.contains('read')).toBe(true); // sort: pročitane gore
  });
});
