import { Injectable } from '@angular/core';
import { StatePersistence } from './persistence';

const DB_NAME = 'read-map';
const STORE = 'state';
const VERSION = 1;

/**
 * Tanki key→value omotač oko IndexedDB-a. IndexedDB je asinkron i radi preko
 * događaja (onsuccess/onerror), pa svaku operaciju zamatamo u Promise da store
 * dobije čist async/await. Serijalizaciju (Set→array) NE radi ovdje — to je
 * posao store-a; ovaj sloj pohranjuje što god dobije.
 */
@Injectable({ providedIn: 'root' })
export class IndexedDbPersistence implements StatePersistence {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise; // otvori bazu jednom, pa recikliraj
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise<T | undefined>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
