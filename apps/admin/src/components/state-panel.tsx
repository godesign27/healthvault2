import type { ReactNode } from 'react';

interface StatePanelProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function StatePanel({ title, description, action }: StatePanelProps) {
  return (
    <main className="state-page">
      <section className="state-panel" aria-live="polite">
        <div className="brand-mark">HV</div>
        <h1>{title}</h1>
        <p>{description}</p>
        {action}
      </section>
    </main>
  );
}
