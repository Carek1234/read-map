import { TestBed } from '@angular/core/testing';
import { Book } from '../domain/book.model';
import { BookStore } from './book-store';
import { EmbeddingService } from './embedding.service';
import { InMemoryPersistence } from './in-memory-persistence';
import { STATE_PERSISTENCE } from './persistence';

// Fake embedder — ne skida model; vraća fiksni vektor.
const fakeEmbeddings = { embed: async () => new Float32Array([0.1, 0.2, 0.3]) };

function setup(persistence = new InMemoryPersistence()) {
  TestBed.configureTestingModule({
    providers: [
      { provide: STATE_PERSISTENCE, useValue: persistence },
      { provide: EmbeddingService, useValue: fakeEmbeddings },
    ],
  });
  return { store: TestBed.inject(BookStore), persistence };
}

describe('BookStore', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('seed: 202 knjige, 4 pročitane; discovered uključuje sve pročitane', () => {
    const { store } = setup();
    expect(store.books().length).toBe(202);
    expect(store.readIds().size).toBe(4);
    expect(store.discovered().size).toBeGreaterThanOrEqual(store.readIds().size);
    for (const id of store.readIds()) expect(store.discovered().has(id)).toBe(true);
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

  it('addBook doda novu knjigu i uđe u computed lanac', async () => {
    const { store } = setup();
    const book: Book = { id: '/works/OLx', title: 'Nova', author: 'A', pages: 100, tags: ['x'], genre: 'adv' };
    expect(await store.addBook(book)).toBe(true);
    expect(store.books().length).toBe(203);
    expect(store.entries().some((e) => e.book.id === '/works/OLx')).toBe(true);
  });

  it('addBook embedda dodanu knjigu (dobije vec)', async () => {
    const { store } = setup();
    await store.addBook({ id: '/works/OLv', title: 'V', author: 'A', pages: 1, tags: ['x'], genre: 'adv' });
    const added = store.books().find((b) => b.id === '/works/OLv');
    expect(added?.vec).toBeInstanceOf(Float32Array);
  });

  it('addBook odbija duplikat po id-u', async () => {
    const { store } = setup();
    const dup: Book = { id: 'zov', title: 'Dupli', author: 'A', pages: 1, tags: [], genre: 'adv' };
    expect(await store.addBook(dup)).toBe(false); // 'zov' je već u seedu
    expect(store.books().length).toBe(202);
  });

  it('addBook persistira userBooks', async () => {
    const { store, persistence } = setup();
    await store.addBook({ id: '/works/OLy', title: 'Y', author: 'A', pages: 1, tags: [], genre: 'crime' });
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
