import { FixtureAdapter } from './FixtureAdapter';
import type { ServiceNowAdapter } from './types';

export type * from './types';
export { FixtureAdapter, renderClosureNote, renderConsolidatedNote } from './FixtureAdapter';

/** The single place where the implementation is chosen. LiveAdapter — after Q1–Q5 are answered. */
export const adapter: ServiceNowAdapter = new FixtureAdapter();
