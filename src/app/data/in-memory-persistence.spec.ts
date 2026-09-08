import { InMemoryPersistence } from './in-memory-persistence';

describe('InMemoryPersistence', () => {
  it('vraća spremljenu vrijednost (roundtrip)', async () => {
    const p = new InMemoryPersistence();
    await p.set('readIds', ['a', 'b']);
    expect(await p.get<string[]>('readIds')).toEqual(['a', 'b']);
  });

  it('nepostojeći ključ je undefined', async () => {
    const p = new InMemoryPersistence();
    expect(await p.get('nema')).toBeUndefined();
  });
});
