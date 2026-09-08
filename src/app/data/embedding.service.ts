import { Injectable, signal } from '@angular/core';

const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'; // ISTI kao skripta → isti prostor

/** Minimalni tip za ono što nam pipeline vraća. */
type Extractor = (
  text: string,
  opts: { pooling: 'mean'; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

@Injectable({ providedIn: 'root' })
export class EmbeddingService {
  /** true dok se model prvi put skida/učitava (UI pokaže "Embedding…"). */
  readonly loading = signal(false);
  private extractor?: Extractor;

  /**
   * Lazy: model se učita tek na prvi poziv, i to dinamičkim importom da
   * @huggingface/transformers NE uđe u početni bundle (ide u zaseban chunk).
   */
  private async pipe(): Promise<Extractor> {
    if (this.extractor) return this.extractor;
    this.loading.set(true);
    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.extractor = (await pipeline('feature-extraction', MODEL)) as unknown as Extractor;
      return this.extractor;
    } finally {
      this.loading.set(false);
    }
  }

  /** Tekst → normalizirani vektor (isti postupak kao offline skripta). */
  async embed(text: string): Promise<Float32Array> {
    const extract = await this.pipe();
    const out = await extract(text, { pooling: 'mean', normalize: true });
    return new Float32Array(out.tolist()[0]);
  }
}
