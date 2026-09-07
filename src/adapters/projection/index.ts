import { FixtureProjectionAdapter } from './FixtureProjectionAdapter';
import type { ProjectionAdapter } from './types';

export type * from './types';
export { FixtureProjectionAdapter };

/** The single place where the implementation is chosen. The live pipeline — after Q7–Q9. */
export const projection: ProjectionAdapter = new FixtureProjectionAdapter();
