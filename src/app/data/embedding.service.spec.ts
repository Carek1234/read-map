import { vi } from 'vitest';

// Mock težinu: model se NIKAD ne skida u testu.
vi.mock('@huggingface/transformers', () => ({
  pipeline: async () => (_text: string) => ({ tolist: () => [[0.1, 0.2, 0.3]] }),
}));

import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  it('embed vraća Float32Array iz pipeline izlaza', async () => {
    const svc = new EmbeddingService();
    const vec = await svc.embed('neki tekst');
    expect(vec).toBeInstanceOf(Float32Array);
    expect(vec.length).toBe(3);
    expect(vec[0]).toBeCloseTo(0.1);
    expect(svc.loading()).toBe(false);
  });
});
