import { InsightsDashboard } from './insights/insights-dashboard';
import { UsersDashboard } from './users/users-dashboard';
import { InteractionsDashboard } from './interactions/interactions-dashboard';
import { CapabilitiesDashboard } from './capabilities/capabilities-dashboard';
import { UnmetNeedsDashboard } from './unmet-needs/unmet-needs-dashboard';
import { WeeklyBriefsDashboard } from './weekly-briefs/weekly-briefs-dashboard';

const SECTIONS = ['insights', 'users', 'interactions', 'capabilities', 'unmet-needs', 'weekly-briefs'];

interface GptAppPageProps { section: string }

export function GptAppPage({ section }: GptAppPageProps) {
  const activeSection = SECTIONS.includes(section) ? section : 'insights';
  const content = {
    insights: <InsightsDashboard />,
    users: <UsersDashboard />,
    interactions: <InteractionsDashboard />,
    capabilities: <CapabilitiesDashboard />,
    'unmet-needs': <UnmetNeedsDashboard />,
    'weekly-briefs': <WeeklyBriefsDashboard />,
  }[activeSection];
  return (
    <main>
      <header className="page-header"><div><p className="eyebrow">Product analytics</p><h1>GPT App</h1><p>Privacy-minimized intelligence for meaningful AI tasks and capabilities.</p></div><span className="status-badge">Foundation</span></header>
      <nav className="tabs" aria-label="GPT App analytics">
        {SECTIONS.map((item) => <a key={item} className={item === activeSection ? 'active' : ''} href={`/products/gpt-app/${item}`}>{item.replace('-', ' ')}</a>)}
      </nav>
      {content}
    </main>
  );
}
