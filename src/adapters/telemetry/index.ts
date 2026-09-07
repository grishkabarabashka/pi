import type { ArticleTelemetry, TelemetryWrite } from '@/domain/types';

/**
 * Telemetry lives only on our side (I6): there are no service fields on kb_knowledge
 * and there is nowhere to keep it in ServiceNow. Nothing here ever reaches ServiceNow.
 *
 * The store is in memory until the backend appears. Everything that is written here
 * is derived from an accepted proposal or from an `article_opened` trail event —
 * there is no other way in.
 */
export interface TelemetryStore {
  write(entry: TelemetryWrite): Promise<void>;
  get(articleId: string): ArticleTelemetry | undefined;
}

const empty = (articleId: string): ArticleTelemetry => ({
  articleId, useCount: 0, confirmations: 0, deviations: 0, notApplicableMarks: 0,
});

export class InMemoryTelemetryStore implements TelemetryStore {
  private byArticle = new Map<string, ArticleTelemetry>();

  async write(entry: TelemetryWrite): Promise<void> {
    const current = this.byArticle.get(entry.articleId) ?? empty(entry.articleId);
    switch (entry.kind) {
      case 'confirmation':
        current.confirmations += 1;
        current.lastConfirmedAt = entry.at;
        break;
      case 'not_applicable':
        current.notApplicableMarks += 1;
        break;
      case 'deviation':
        current.deviations += 1;
        break;
      case 'use':
        current.useCount += 1;
        break;
    }
    this.byArticle.set(entry.articleId, current);
  }

  get(articleId: string): ArticleTelemetry | undefined {
    return this.byArticle.get(articleId);
  }
}

export const telemetry: TelemetryStore = new InMemoryTelemetryStore();
