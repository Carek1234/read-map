import { TestBed } from '@angular/core/testing';
import { Book } from '../domain/book.model';
import { BookStore } from './book-store';
import { InMemoryPersistence } from './in-memory-persistence';
import { STATE_PERSISTENCE } from './persistence';

function setup(persistence = new InMemoryPersistence()) {
  TestBed.configureTestingModule({
    providers: [{ provide: STATE_PERSISTENCE, useValue: persistence }],
  });
  return { store: TestBed.inject(BookStore), persistence };
}

describe('BookStore', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('seed: 202 knjige, 4 pročitane, 20 otkrivenih (K=5)', () => {
    const { store } = setup();
    expect(store.books().length).toBe(202);
    expect(store.readIds().size).toBe(4);
    expect(store.discovered().size).toBe(20);
  });

  it('toggleRead preračuna computed lanac', () => {
    const { store } = setup();
    const unread = store.books().find((b) => !store.readIds().has(b.id))!;
    store.toggleRead(unread.id);
    expect(store.readIds().has(unread.id)).toBe(true);
    expect(store.discovered().has(unread.id)).toBe(true); // pročitana je uvijek otkrivena
    store.toggleRead(unread.id);
    expect(store.readIds().has(unread.id)).toBe(false);
  });

  it('sprema readIds u perzistenciju na promjenu', async () => {
    const { store, persistence } = setup();
    const unread = store.books().find((b) => !store.readIds().has(b.id))!;
    store.toggleRead(unread.id);
    const stored = await persistence.get<string[]>('readIds');
    expect(stored).toContain(unread.id);
  });

  it('hidrira readIds iz perzistencije pri init()', async () => {
    const persistence = new InMemoryPersistence();
    await persistence.set('readIds', ['zov']);
    const { store } = setup(persistence);
    await store.init();
    expect(store.readIds().has('zov')).toBe(true);
    expect(store.readIds().size).toBe(1); // spremljeno zamjenjuje seed
  });

  it('entries: po zapis za svaku knjigu, pročitana ima heat 1', () => {
    const { store } = setup();
    expect(store.entries().length).toBe(202);
    const zov = store.entries().find((e) => e.book.id === 'zov')!;
    expect(zov.read).toBe(true);
    expect(zov.heat).toBe(1);
  });

  it('addBook doda novu knjigu i uđe u computed lanac', () => {
    const { store } = setup();
    const book: Book = { id: '/works/OLx', title: 'Nova', author: 'A', pages: 100, tags: ['x'], genre: 'adv' };
    expect(store.addBook(book)).toBe(true);
    expect(store.books().length).toBe(203);
    expect(store.entries().some((e) => e.book.id === '/works/OLx')).toBe(true);
  });

  it('addBook odbija duplikat po id-u', () => {
    const { store } = setup();
    const dup: Book = { id: 'zov', title: 'Dupli', author: 'A', pages: 1, tags: [], genre: 'adv' };
    expect(store.addBook(dup)).toBe(false); // 'zov' je već u seedu
    expect(store.books().length).toBe(202);
  });

  it('addBook persistira userBooks', async () => {
    const { store, persistence } = setup();
    store.addBook({ id: '/works/OLy', title: 'Y', author: 'A', pages: 1, tags: [], genre: 'crime' });
    const stored = await persistence.get<Book[]>('userBooks');
    expect(stored?.map((b) => b.id)).toContain('/works/OLy');
  });

  it('hidrira userBooks pri init()', async () => {
    const persistence = new InMemoryPersistence();
    await persistence.set('userBooks', [
      { id: '/works/OLz', title: 'Z', author: 'A', pages: 1, tags: [], genre: 'adv' },
    ]);
    const { store } = setup(persistence);
    await store.init();
    expect(store.books().some((b) => b.id === '/works/OLz')).toBe(true);
  });
});
