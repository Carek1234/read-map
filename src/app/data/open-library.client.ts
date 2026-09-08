import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Očišćen rezultat pretrage — UI ne vidi sirova OL polja. */
export interface OlSearchResult {
  key: string; // "/works/OL...W" — radni identitet, naš budući id
  title: string;
  author: string;
  year?: number;
  pages?: number;
  subjects: string[];
}

/** Sirovi oblik odgovora (samo polja koja tražimo). */
interface OlResponse {
  docs?: Array<{
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    number_of_pages_median?: number;
    subject?: string[];
  }>;
}

const SEARCH_URL = 'https://openlibrary.org/search.json';
const FIELDS = 'key,title,author_name,first_publish_year,number_of_pages_median,subject';

@Injectable({ providedIn: 'root' })
export class OpenLibraryClient {
  private readonly http = inject(HttpClient);

  /** Pretraži OL. Prazan upit ne dira mrežu. Vraća normalizirane rezultate. */
  async search(query: string, limit = 10): Promise<OlSearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    const res = await firstValueFrom(
      this.http.get<OlResponse>(SEARCH_URL, { params: { q, fields: FIELDS, limit } }),
    );
    return (res.docs ?? []).map((d) => ({
      key: d.key,
      title: d.title,
      author: d.author_name?.[0] ?? 'Unknown author',
      year: d.first_publish_year,
      pages: d.number_of_pages_median,
      subjects: d.subject ?? [],
    }));
  }
}
