import type { AnchorRef, KnowledgePage } from '@/domain/types';

const day = 864e5;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();

const anc = (sysId: string, path: string[], hash: string): AnchorRef => ({
  articleSysId: sysId, headingPath: path, contentHash: hash,
});

/**
 * The projection assembled by the pipeline from kb_knowledge. Read, never written (I1).
 * A block with anchor: null has no counterpart in the article.
 */
export const pages: Record<string, KnowledgePage> = {
  kb_0010441: {
    id: 'kb_0010441',
    articleSysId: 'kb_0010441',
    title: 'FIX gateway: latency diagnostics',
    type: 'procedure_fault',
    application: 'FIX Gateway',
    version: '7',
    rebuiltAt: new Date(Date.now() - 26 * 60_000).toISOString(),
    telemetry: { useCount: 14, lastConfirmedAt: ago(3), deviations: 2, notApplicableMarks: 1 },
    blocks: [
      {
        id: 'b1', pageId: 'kb_0010441', section: 'applicability',
        body: 'Latency growth on GW-* nodes in the EMEA region, confirmed in the monitoring dashboard for longer than five minutes. Do not apply when the node is fully unavailable — that is a separate procedure.',
        anchor: anc('kb_0010441', ['Applicability'], 'h0'),
      },
      {
        id: 'b2', pageId: 'kb_0010441', section: 'steps',
        body: '1. Check the latency on GW-3 in the monitoring dashboard.\n2. Compare the growth window with the CI change window.\n3. Restart the gw-router service.',
        anchor: anc('kb_0010441', ['Steps'], 'h3'),
      },
      {
        id: 'b3', pageId: 'kb_0010441', section: 'branching',
        body: 'If the latency did not change after the restart, the source is further upstream. Look at the MQ queue depth on upstream.',
        anchor: anc('kb_0010441', ['Branching'], 'h5'),
      },
      {
        id: 'b4', pageId: 'kb_0010441', section: 'verification',
        body: 'The latency is back to normal and holds for ten minutes in a row.',
        anchor: anc('kb_0010441', ['Verification'], 'h4'),
      },
      {
        id: 'b5', pageId: 'kb_0010441', section: 'free',
        body: 'Over the quarter the procedure was applied on 14 requests; in 12 cases draining the MQ queue helped, twice the cause was on the line provider side.',
        anchor: null,
      },
    ],
    observations: [
      {
        id: 'o1', pageId: 'kb_0010441',
        text: 'An MQ queue depth above 40,000 consistently precedes latency growth on GW-3.',
        basis: 'a remark in the dialogue on INC0447901, one case',
        confirmations: 1, promotionThreshold: 2, raisedAt: ago(9),
        sourceTicketIds: ['INC0447901'],
      },
      {
        id: 'o2', pageId: 'kb_0010441',
        text: 'Restarting gw-router does not help when the growth started inside a pool configuration change window.',
        basis: 'a "did not help" step mark on two tickets',
        confirmations: 2, promotionThreshold: 2, raisedAt: ago(34),
        sourceTicketIds: ['INC0447120', 'INC0446880'],
      },
    ],
    neighbors: [
      { pageId: 'kb_0010512', title: 'MQ: draining the upstream queue', kind: 'co_occurrence', derivedFrom: 'used together on nine tickets', weight: 9 },
      { pageId: 'kb_0030117', title: 'FIX Gateway: architecture and owners', kind: 'shared_ci', derivedFrom: 'shared CI ci_fix_gw' },
    ],
    history: [
      { id: 'h1', at: ago(3), author: 'Shift engineer', sourceTicketId: 'INC0447901', summary: 'Verification refined: keep it under observation for ten minutes', revertable: true },
      { id: 'h2', at: ago(28), author: 'Application owner', summary: 'A branch point on upstream added', revertable: true },
      { id: 'h3', at: ago(96), author: 'Application owner', summary: 'Initial publication', revertable: false },
    ],
  },

  kb_0010512: {
    id: 'kb_0010512',
    articleSysId: 'kb_0010512',
    title: 'MQ: draining the upstream queue',
    type: 'procedure_fault',
    application: 'FIX Gateway',
    version: '3',
    rebuiltAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    telemetry: { useCount: 6, lastConfirmedAt: ago(41), deviations: 1, notApplicableMarks: 0 },
    blocks: [
      { id: 'c1', pageId: 'kb_0010512', section: 'applicability', body: 'The queue depth on the upstream node has been growing for more than ten minutes.', anchor: anc('kb_0010512', ['Applicability'], 'm0') },
      { id: 'c2', pageId: 'kb_0010512', section: 'steps', body: '1. Take the current depth.\n2. Stop the feed for the duration of the drain.\n3. Start the drain and wait until it falls below 5,000.', anchor: anc('kb_0010512', ['Steps'], 'm1') },
      { id: 'c3', pageId: 'kb_0010512', section: 'verification', body: 'The depth is below 5,000 and the consumers are not lagging.', anchor: anc('kb_0010512', ['Verification'], 'm2') },
    ],
    observations: [],
    neighbors: [
      { pageId: 'kb_0010441', title: 'FIX gateway: latency diagnostics', kind: 'co_occurrence', derivedFrom: 'used together on nine tickets', weight: 9 },
    ],
    history: [
      { id: 'mh1', at: ago(41), author: 'Shift engineer', sourceTicketId: 'INC0446880', summary: 'The drain threshold refined', revertable: true },
    ],
  },

  kb_0030117: {
    id: 'kb_0030117',
    articleSysId: 'kb_0030117',
    title: 'FIX Gateway: architecture and owners',
    type: 'reference',
    application: 'FIX Gateway',
    version: '12',
    rebuiltAt: new Date(Date.now() - 40 * 60_000).toISOString(),
    // Reference: freshness comes from attestation and CI drift, not from tickets.
    telemetry: { useCount: 0, deviations: 0, notApplicableMarks: 0, lastAttestedAt: ago(410), ciChangesSinceAttestation: 7 },
    blocks: [
      { id: 'r1', pageId: 'kb_0030117', section: 'free', body: 'Nodes GW-1…GW-4, EMEA region. Balancing is on the line provider side.', anchor: anc('kb_0030117', ['Composition'], 'r0') },
      { id: 'r2', pageId: 'kb_0030117', section: 'free', body: 'The application owner is the fix-platform group. The on-call contact is available during CET business hours.', anchor: anc('kb_0030117', ['Owners'], 'r1') },
    ],
    observations: [],
    neighbors: [
      { pageId: 'kb_0010441', title: 'FIX gateway: latency diagnostics', kind: 'shared_ci', derivedFrom: 'shared CI ci_fix_gw' },
    ],
    history: [
      { id: 'rh1', at: ago(410), author: 'Application owner', summary: 'Attestation of the node composition', revertable: false },
    ],
  },

  kb_0020310: {
    id: 'kb_0020310',
    articleSysId: 'kb_0020310',
    title: 'Granting access to monitoring dashboards',
    type: 'procedure_fulfilment',
    application: 'MQ Monitoring',
    version: '5',
    rebuiltAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    telemetry: { useCount: 31, lastConfirmedAt: ago(270), deviations: 4, notApplicableMarks: 2 },
    blocks: [
      { id: 'a1', pageId: 'kb_0020310', section: 'applicability', body: 'A request for access to monitoring dashboards, read-only role.', anchor: anc('kb_0020310', ['Applicability'], 'a0') },
      { id: 'a2', pageId: 'kb_0020310', section: 'steps', body: "1. Check the manager's approval.\n2. Add to the mq-viewers group.", anchor: anc('kb_0020310', ['Steps'], 'a1') },
    ],
    observations: [
      {
        id: 'o3', pageId: 'kb_0020310',
        text: 'For contractors an additional approval from the data owner is required.',
        basis: 'a remark in the dialogue on REQ0031880, one case',
        confirmations: 1, promotionThreshold: 2, raisedAt: ago(220),
        sourceTicketIds: ['REQ0031880'],
      },
    ],
    neighbors: [],
    history: [
      { id: 'ah1', at: ago(270), author: 'Shift engineer', sourceTicketId: 'REQ0031880', summary: 'The access group name added', revertable: true },
    ],
  },
};
