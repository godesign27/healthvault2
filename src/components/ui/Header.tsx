import { useState } from 'react';
import { Calendar, ChevronDown, Edit3, Search, SlidersHorizontal, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  title?: string;
  showStatus?: boolean;
  showDate?: boolean;
  showActions?: boolean;
  showLanguage?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
}

export function Header({
  title = 'ALIGNMENTS',
  showStatus = true,
  showDate = true,
  showActions = true,
  showLanguage = true,
  showSearch = false,
  showFilter = false,
}: HeaderProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu]   = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    'English (US)', 'Spanish (Latin America)', 'German',
    'Japanese', 'Portuguese (Brazil)', 'Chinese (Simplified)',
  ];

  const actions = ['Alignments Map', 'Split Map', 'Affiliations Map', 'Roster', 'Configurations'];

  const menuItemClass = 'w-full text-left px-4 py-2 hover:bg-action-secondary text-sm text-content-primary border-b border-stroke-subtle last:border-b-0 transition-colors';

  return (
    <div className="bg-surface-raised border-b border-stroke-subtle px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="bg-hv-orange-600 text-hv-neutral-0 px-4 py-1.5 font-semibold text-sm uppercase">
            {title}
          </span>

          {showStatus && (
            <span className="bg-action-primary text-content-on-action px-4 py-1.5 font-semibold text-sm">
              ACTIVE
            </span>
          )}

          {showDate && (
            <div className="flex items-center gap-2 text-content-secondary text-sm">
              <Calendar className="w-4 h-4" />
              <span>Cardiology — Apr 22, 2020</span>
            </div>
          )}

          {showActions && (
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-2 px-4 py-1.5 bg-action-primary text-content-on-action hover:bg-action-primary-hover transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-sm font-medium">Configurations</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showActionsMenu && (
                <div className="absolute top-full left-0 mt-2 bg-surface-overlay border border-stroke-default shadow-lg min-w-[200px] z-10">
                  {actions.map((action, i) => (
                    <button key={i} onClick={() => setShowActionsMenu(false)} className={menuItemClass}>
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSearch && (
            <button className="p-2 hover:bg-action-secondary transition-colors rounded">
              <Search className="w-5 h-5 text-content-secondary" />
            </button>
          )}

          {showFilter && (
            <button className="p-2 hover:bg-action-secondary transition-colors rounded">
              <SlidersHorizontal className="w-5 h-5 text-content-secondary" />
            </button>
          )}

          {showLanguage && (
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-4 py-1.5 bg-action-primary text-content-on-action hover:bg-action-primary-hover transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedLanguage}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 bg-surface-overlay border border-stroke-default shadow-lg min-w-[220px] z-10">
                  {languages.map((lang, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedLanguage(lang.split(' ')[0]); setShowLanguageMenu(false); }}
                      className={menuItemClass}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
