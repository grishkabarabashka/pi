import type { Ticket } from '@/domain/types';

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const tickets: Ticket[] = [
  {
    id: 'INC0448213', sysId: 'sn_inc_1', type: 'incident',
    title: 'FIX gateway latency, EMEA',
    description:
      '[enrichment] Latency growth detected on GW-3. Suggested steps: see KB0010441.',
    application: 'FIX Gateway', ciId: 'ci_fix_gw', priority: 'P2',
    origin: 'alert', alertSignature: 'fix.gw.latency.emea',
    assignee: 'me', state: 'work', openedAt: ago(14),
    bucket: 'swarm', tags: ['recurring'], knowledgeMatch: 'strong',
  },
  {
    id: 'INC0448190', sysId: 'sn_inc_2', type: 'incident',
    title: 'Balance mismatch in the T+1 report',
    description: 'The operator reports a mismatch of amounts in the nightly report.',
    application: 'Settlement Reports', ciId: 'ci_settle', priority: 'P3',
    origin: 'user', assignee: 'me', state: 'work', openedAt: ago(96),
    tags: [], knowledgeMatch: 'none',
  },
  {
    id: 'REQ0032118', sysId: 'sn_req_1', type: 'universal_request',
    title: 'MQ monitoring dashboard access for a new analyst',
    description: 'Access request, read-only role.',
    application: 'MQ Monitoring', ciId: 'ci_mq', priority: 'P4',
    origin: 'user', assignee: 'me', state: 'wait', openedAt: ago(310),
    bucket: 'handover', tags: ['wait-team'], knowledgeMatch: 'weak',
  },
  {
    id: 'INC0448077', sysId: 'sn_inc_3', type: 'incident',
    title: 'Timeouts during the export to the warehouse',
    description: 'The nightly export finished with a timeout.',
    application: 'Data Export', ciId: 'ci_export', priority: 'P3',
    origin: 'alert', alertSignature: 'export.timeout',
    assignee: 'me', state: 'closed', openedAt: ago(640), closedAt: ago(120),
    tags: [], knowledgeMatch: 'stale',
  },
  {
    id: 'INC0448240', sysId: 'sn_inc_4', type: 'incident',
    title: 'The MQ queue is growing on the upstream node',
    description: 'Alert: depth > 12000 for 10 minutes.',
    application: 'FIX Gateway', ciId: 'ci_fix_gw', priority: 'P2',
    origin: 'alert', alertSignature: 'mq.depth.upstream',
    state: 'queue', openedAt: ago(6), tags: [], knowledgeMatch: 'strong',
  },
  {
    id: 'INC0448239', sysId: 'sn_inc_5', type: 'incident',
    title: 'A user cannot sign in to the quote terminal',
    description: 'An authorisation error for three users in the department.',
    application: 'Quote Terminal', ciId: 'ci_quote', priority: 'P3',
    origin: 'user', state: 'queue', openedAt: ago(22),
    tags: [], knowledgeMatch: 'stale',
  },
  {
    id: 'REQ0032125', sysId: 'sn_req_2', type: 'universal_request',
    title: 'Renewal of the custody integration certificate',
    description: 'The certificate expires in 12 days.',
    application: 'Custody Link', priority: 'P4',
    origin: 'user', state: 'queue', openedAt: ago(180),
    tags: [], knowledgeMatch: 'none',
  },

  // Colleagues' tickets: visible in the general queue, not in the list on the left.
  {
    id: 'INC0448201', sysId: 'sn_inc_6', type: 'incident',
    title: 'The nightly position reconciliation job failed',
    description: 'The job finished with an error on the load step.',
    application: 'Settlement Reports', ciId: 'ci_settle', priority: 'P2',
    origin: 'alert', alertSignature: 'settle.job.fail',
    assignee: 'a.kern', state: 'work', openedAt: ago(48),
    bucket: 'attention', tags: [], knowledgeMatch: 'weak',
  },
  {
    id: 'INC0448166', sysId: 'sn_inc_7', type: 'incident',
    title: 'The instrument reference data is out of sync',
    description: 'A mismatch between the venue and the internal reference data.',
    application: 'Quote Terminal', ciId: 'ci_quote', priority: 'P3',
    origin: 'user', assignee: 'r.mehta', state: 'work', openedAt: ago(210),
    tags: ['recurring'], knowledgeMatch: 'stale',
  },
  {
    id: 'REQ0032090', sysId: 'sn_req_3', type: 'universal_request',
    title: 'Storage quota increase for the reports',
    description: 'A request from the reporting team.',
    application: 'Settlement Reports', priority: 'P4',
    origin: 'user', assignee: 'j.olsen', state: 'wait', openedAt: ago(1450),
    tags: ['wait-team'], knowledgeMatch: 'none',
  },
  {
    id: 'INC0448244', sysId: 'sn_inc_8', type: 'incident',
    title: 'Quote publication errors on the external channel',
    description: 'Alert: the publication error rate is above 2% for ten minutes.',
    application: 'Quote Terminal', ciId: 'ci_quote', priority: 'P1',
    origin: 'alert', alertSignature: 'quote.publish.errors',
    state: 'queue', openedAt: ago(3), tags: [], knowledgeMatch: 'none',
  },
];
