import { AlertTriangle } from 'lucide-react';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <>
      <div className="section-intro"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>
      <div className="synthetic-notice"><AlertTriangle size={18} /><p><strong>Synthetic narrative.</strong> These values demonstrate the decision workflow and do not represent real users.</p></div>
    </>
  );
}
