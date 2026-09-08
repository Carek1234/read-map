import { InjectionToken } from '@angular/core';

/** Usko sučelje za trajno stanje. Store ovisi o OVOME, ne o IndexedDB-u. */
export interface StatePersistence {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

/** DI token: apstrakcija koju u produkciji puni IndexedDB, u testu memorija. */
export const STATE_PERSISTENCE = new InjectionToken<StatePersistence>('StatePersistence');
