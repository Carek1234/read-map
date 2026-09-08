import { TestBed } from '@angular/core/testing';
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
});
