import { TestBed } from '@angular/core/testing';
import { Book } from '../domain/book.model';
import { BookStore } from './book-store';
import { EmbeddingService } from './embedding.service';
import { InMemoryPersistence } from './in-memory-persistence';
import { STATE_PERSISTENCE } from './persistence';

const fakeEmbeddings = { embed: async () => new Float32Array([0.1, 0.2, 0.3]) };
const mkBook = (id: string): Book => ({ id, title: id, author: 'A', pages: 1, tags: ['x'], genre: 'adv' });

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

  it('demo (default): 202 knjige, 4 pročitane; discovered uključuje pročitane', () => {
    const { store } = setup();
    expect(store.mode()).toBe('demo');
    expect(store.books().length).toBe(202);
    expect(store.readIds().size).toBe(4);
    for (const id of store.readIds()) expect(store.discovered().has(id)).toBe(true);
  });

  it('toggleRead u demo je ephemeral — mijenja stanje, ne persistira', async () => {
    const { store, persistence } = setup();
    const unread = store.books().find((b) => !store.readIds().has(b.id))!;
    store.toggleRead(unread.id);
    expect(store.readIds().has(unread.id)).toBe(true);
    expect(await persistence.get('ownReads')).toBeUndefined();
  });

  it('startOwn daje prazno platno', () => {
    const { store } = setup();
    store.startOwn();
    expect(store.mode()).toBe('own');
    expect(store.books().length).toBe(0);
    expect(store.readIds().size).toBe(0);
  });

  it('addBook prebaci u own, embedda i persistira', async () => {
    const { store, persistence } = setup();
    expect(await store.addBook(mkBook('/works/OLx'))).toBe(true);
    expect(store.mode()).toBe('own');
    expect(store.books().length).toBe(1);
    expect(store.books()[0].vec).toBeInstanceOf(Float32Array);
    const stored = await persistence.get<Book[]>('ownBooks');
    expect(stored?.map((b) => b.id)).toContain('/works/OLx');
  });

  it('addBook odbija duplikat po id-u', async () => {
    const { store } = setup();
    await store.addBook(mkBook('/works/OLy'));
    expect(await store.addBook(mkBook('/works/OLy'))).toBe(false);
    expect(store.books().length).toBe(1);
  });

  it('own toggle persistira; init vraća mode + own podatke', async () => {
    const persistence = new InMemoryPersistence();
    {
      const { store } = setup(persistence);
      await store.addBook(mkBook('/works/OLz'));
      store.toggleRead('/works/OLz');
    }
    TestBed.resetTestingModule();
    const { store } = setup(persistence);
    await store.init();
    expect(store.mode()).toBe('own');
    expect(store.books().some((b) => b.id === '/works/OLz')).toBe(true);
    expect(store.readIds().has('/works/OLz')).toBe(true);
  });

  it('entries u demo: 202 zapisa, pročitana ima heat 1', () => {
    const { store } = setup();
    expect(store.entries().length).toBe(202);
    const zov = store.entries().find((e) => e.book.id === 'zov')!;
    expect(zov.read).toBe(true);
    expect(zov.heat).toBe(1);
  });
});
