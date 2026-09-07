import type { KnowledgePage, KnowledgePageSummary } from '@/domain/types';

/**
 * The boundary with the projection pipeline. The interface is deliberately read-only:
 * nothing reaches the projection bypassing ServiceNow (I1), so there is no write method
 * here and there can be none. An edit goes as a proposal through
 * ServiceNowAdapter.publishArticleVersion and comes back as a rebuild.
 */
export interface ProjectionAdapter {
  listPages(): Promise<KnowledgePageSummary[]>;
  getPage(pageId: string): Promise<KnowledgePage>;
}
