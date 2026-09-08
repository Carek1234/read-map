import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { STATE_PERSISTENCE } from './data/persistence';
import { InMemoryPersistence } from './data/in-memory-persistence';

describe('App', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: STATE_PERSISTENCE, useValue: new InMemoryPersistence() }],
    }),
  );

  it('kreira se', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('prikazuje zaglavlje i listu', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('read-map');
    expect(el.querySelector('app-book-list')).toBeTruthy();
  });

  it('demo skriva search; "Start your own" ga pokaže', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-book-search')).toBeNull(); // demo: nema searcha

    const startBtn = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Start your own'),
    )!;
    startBtn.click();
    fixture.detectChanges();
    expect(el.querySelector('app-book-search')).toBeTruthy(); // own: search se pojavi
  });
});
