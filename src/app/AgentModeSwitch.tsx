import { useState } from 'react';
import { getAgentMode, setAgentMode, type AgentMode } from '@/agent/agent';
import s from './AgentModeSwitch.module.css';

const modes: { id: AgentMode; label: string }[] = [
  { id: 'normal', label: 'the model answers' },
  { id: 'slow', label: 'slow (30 s)' },
  { id: 'down', label: 'unavailable' },
];

/** A switch for checking I2. Not part of the product interface. */
export function AgentModeSwitch() {
  const [mode, set] = useState<AgentMode>(getAgentMode());
  return (
    <div className={s.bar}>
      <span className="faint">I2 check:</span>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`${s.item} ${mode === m.id ? s.active : ''}`}
          onClick={() => { setAgentMode(m.id); set(m.id); }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
