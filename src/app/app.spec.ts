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
});
