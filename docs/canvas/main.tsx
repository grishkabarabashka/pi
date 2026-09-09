/** Standalone entry for the diagrams. Not part of the application. */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KnowledgeLoopCanvas } from '@/screens/docs/canvas/KnowledgeLoopCanvas';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KnowledgeLoopCanvas />
  </StrictMode>,
);
