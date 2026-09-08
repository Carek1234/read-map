import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { STATE_PERSISTENCE } from './data/persistence';
import { IndexedDbPersistence } from './data/indexeddb-persistence';
import { BookStore } from './data/book-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: STATE_PERSISTENCE, useExisting: IndexedDbPersistence },
    provideAppInitializer(() => inject(BookStore).init()),
  ]
};
