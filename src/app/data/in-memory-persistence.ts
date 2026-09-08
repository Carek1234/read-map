import { Injectable } from '@angular/core';
import { StatePersistence } from './persistence';

/** Perzistencija u RAM-u: ista pravila, bez baze. Za testove i kao fallback. */
@Injectable()
export class InMemoryPersistence implements StatePersistence {
  private store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
}
