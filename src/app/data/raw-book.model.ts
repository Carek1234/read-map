import { Genre } from '../domain/book.model';

/** Oblik zapisa u books.json. Ima `read` — domenski Book ga NEMA. */
export interface RawBook {
  id: string;
  title: string;
  author: string;
  pages: number;
  read: boolean;
  tags: string[];
  genre: Genre;
}
