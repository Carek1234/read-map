import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OpenLibraryClient } from './open-library.client';

describe('OpenLibraryClient', () => {
  let client: OpenLibraryClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(OpenLibraryClient);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('mapira docs u OlSearchResult', async () => {
    const promise = client.search('dune');
    const req = httpMock.expectOne((r) => r.url === 'https://openlibrary.org/search.json');
    expect(req.request.params.get('q')).toBe('dune');
    req.flush({
      docs: [
        {
          key: '/works/OL1W',
          title: 'Dune',
          author_name: ['Frank Herbert'],
          first_publish_year: 1965,
          number_of_pages_median: 607,
          subject: ['Science fiction'],
        },
      ],
    });
    expect(await promise).toEqual([
      {
        key: '/works/OL1W',
        title: 'Dune',
        author: 'Frank Herbert',
        year: 1965,
        pages: 607,
        subjects: ['Science fiction'],
      },
    ]);
  });

  it('prazan upit ne zove mrežu', async () => {
    expect(await client.search('   ')).toEqual([]);
    httpMock.expectNone(() => true);
  });
});
