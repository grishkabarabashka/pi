import type { AnchorRef, StepInstance, Suggestion } from '@/domain/types';
import type { ChangeRef } from '@/domain/types';
import type { ArticleBody } from '@/adapters/servicenow/types';

const day = 864e5;
const anchor = (path: string[], hash: string): AnchorRef => ({
  articleSysId: 'kb_0010441', headingPath: path, contentHash: hash,
});

export const suggestions: Record<string, Suggestion> = {
  INC0448213: {
    ticketId: 'INC0448213',
    alertHistory: {
      signature: 'fix.gw.latency.emea',
      occurrences: 14,
      commonCount: 12,
      commonResolution: 'draining the MQ queue on upstream helped in 12 of 14 occurrences',
      exceptions: 'twice it was a real problem on the line provider side',
    },
    articles: [
      {
        articleId: 'kb_0010441',
        title: 'FIX gateway: latency diagnostics',
        matchReason: 'the CI and the alert signature matched',
        lastConfirmedAt: new Date(Date.now() - 3 * day).toISOString(),
        useCount: 14,
        freshness: 'fresh',
      },
      {
        articleId: 'kb_0010512',
        title: 'MQ: draining the upstream queue',
        matchReason: 'linked from the latency article',
        lastConfirmedAt: new Date(Date.now() - 41 * day).toISOString(),
        useCount: 6,
        freshness: 'stale',
      },
    ],
    similarTickets: [
      {
        ticketId: 'INC0447901',
        title: 'FIX gateway latency, EMEA',
        outcome: 'MQ queue drained, 22 minutes',
        closedAt: new Date(Date.now() - 9 * day).toISOString(),
      },
      {
        ticketId: 'INC0447120',
        title: 'Latency growth on GW-3',
        outcome: 'a line provider problem, escalated',
        closedAt: new Date(Date.now() - 34 * day).toISOString(),
      },
    ],
  },

  // The "no matches at all" scenario: the sources panel is empty and labelled.
  INC0448190: { ticketId: 'INC0448190', articles: [], similarTickets: [] },

  REQ0032118: {
    ticketId: 'REQ0032118',
    articles: [
      {
        articleId: 'kb_0020310',
        title: 'Granting access to monitoring dashboards',
        matchReason: 'the application and the request type matched',
        lastConfirmedAt: new Date(Date.now() - 270 * day).toISOString(),
        useCount: 31,
        freshness: 'stale',
      },
    ],
    similarTickets: [
      {
        ticketId: 'REQ0031880',
        title: 'MQ access for an analyst',
        outcome: 'read-only granted through the mq-viewers group',
        closedAt: new Date(Date.now() - 60 * day).toISOString(),
      },
    ],
  },
};

export const steps: Record<string, StepInstance[]> = {
  INC0448213: [
    { id: 's1', ticketId: 'INC0448213', text: 'Check the latency on GW-3 in the monitoring dashboard', state: 'open', stepRef: anchor(['Steps', '1'], 'h1') },
    { id: 's2', ticketId: 'INC0448213', text: 'Compare the growth window with the CI change window', state: 'open', stepRef: anchor(['Steps', '2'], 'h2') },
    { id: 's3', ticketId: 'INC0448213', text: 'Restart the gw-router service', state: 'open', stepRef: anchor(['Steps', '3'], 'h3') },
    { id: 's4', ticketId: 'INC0448213', text: 'Make sure the latency is back to normal', state: 'open', stepRef: anchor(['Verification'], 'h4') },
  ],
  REQ0032118: [
    { id: 'r1', ticketId: 'REQ0032118', text: "Check the manager's approval", state: 'open', stepRef: anchor(['Steps', '1'], 'r1') },
    { id: 'r2', ticketId: 'REQ0032118', text: 'Add to the mq-viewers group', state: 'open', stepRef: anchor(['Steps', '2'], 'r2') },
  ],
};

export const changesNearCi: Record<string, ChangeRef[]> = {
  ci_fix_gw: [
    {
      id: 'CHG0045120',
      system: 'FIX Gateway, pool configuration',
      at: new Date(Date.now() - 55 * 60_000).toISOString(),
      url: '#',
    },
  ],
};

export const articles: Record<string, ArticleBody> = {
  kb_0010441: {
    sysId: 'kb_0010441',
    title: 'FIX gateway: latency diagnostics',
    version: '7',
    blocks: [
      { id: 'b1', body: 'Applicability: latency growth on GW-* nodes, EMEA region.', anchor: anchor(['Applicability'], 'h0') },
      { id: 'b2', body: 'Restart the gw-router service', anchor: anchor(['Steps', '3'], 'h3') },
      // A block without an anchor: synthesised by the pipeline, not editable in place.
      { id: 'b3', body: 'A summary over 14 requests in the quarter.', anchor: null },
    ],
  },
};
