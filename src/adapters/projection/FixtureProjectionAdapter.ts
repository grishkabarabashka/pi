import type { KnowledgePage, KnowledgePageSummary } from '@/domain/types';
import type { ProjectionAdapter } from './types';
import { pages } from '~fixtures/projection';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class FixtureProjectionAdapter implements ProjectionAdapter {
  constructor(private readonly latencyMs = 260) {}

  async listPages(): Promise<KnowledgePageSummary[]> {
    await delay(this.latencyMs);
    return Object.values(pages).map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      application: p.application,
      telemetry: p.telemetry,
      observationsPending: p.observations.filter((o) => o.confirmations < o.promotionThreshold).length,
    }));
  }

  async getPage(pageId: string): Promise<KnowledgePage> {
    await delay(this.latencyMs);
    const page = pages[pageId];
    if (!page) throw new Error(`the projection ${pageId} has not been assembled`);
    return page;
  }
}
